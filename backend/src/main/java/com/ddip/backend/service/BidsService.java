package com.ddip.backend.service;

import com.ddip.backend.aop.DistributedLock;
import com.ddip.backend.dto.bids.BidsRequestDto;
import com.ddip.backend.dto.bids.BidsResponseDto;
import com.ddip.backend.dto.bids.CreateBidsDto;
import com.ddip.backend.dto.bids.CreateMyBidsDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.dto.enums.MyAuctionStatus;
import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.Bids;
import com.ddip.backend.entity.MyBids;
import com.ddip.backend.entity.User;
import com.ddip.backend.es.document.AuctionDocument;
import com.ddip.backend.es.repository.AuctionElasticSearchRepository;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.exception.auction.EndedAuctionException;
import com.ddip.backend.exception.auction.InvalidBidStepException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.BidsRepository;
import com.ddip.backend.repository.MyBidsRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.aspectj.runtime.internal.Conversions.intValue;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BidsService {

    private final BidsRepository bidsRepository;
    private final UserRepository userRepository;
    private final MyBidsRepository myBidsRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionElasticSearchRepository auctionElasticSearchRepository;

    private final PointService pointService;

    /**
     * 경매 참여
     */
    @DistributedLock(key = "auction:#{#auctionId}")
    public BidsResponseDto createBid(Long userId, Long auctionId, BidsRequestDto dto) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionNotFoundException(auctionId));

        if (auction.getAuctionStatus() != AuctionStatus.RUNNING) {
            throw new EndedAuctionException(AuctionStatus.RUNNING);
        }

        long minPrice = auction.getCurrentPrice() + auction.getBidStep();

        if (dto.getPrice() < minPrice) {
            throw new InvalidBidStepException(intValue(dto.getPrice()));
        }

        auction.updateCurrentPrice(dto.getPrice());

        CreateBidsDto createBidsDto = new CreateBidsDto(user, auction, dto.getPrice());

        CreateMyBidsDto createMyBidsDto = new CreateMyBidsDto(user, auction, dto.getPrice());

        // 해당 유저의 MyBids 가 없으면 생성, 있으면 갱신
        MyBids myBids = myBidsRepository.findByUserIdAndAuctionId(userId, auctionId)
                        .orElseGet(() -> MyBids.from(createMyBidsDto));

        long prevPrice= myBids.getLastBidPrice() == null ? 0 : myBids.getLastBidPrice();
        long newPrice = dto.getPrice();

        long resultPrice = newPrice - prevPrice;

        log.info("user: {}, prevPrice: {}, newPrice: {}, resultPrice: {}",
                user.getUsername(), prevPrice, newPrice, resultPrice);

        if (resultPrice > 0) {
            pointService.changePoint(user.getId(), -resultPrice, PointLedgerType.USE,
                    PointLedgerSource.AUCTION, auctionId, "경매 입찰");
        }

        User currentWinner = auction.getCurrentWinner();

        // 기존 선두가 있으면 OUTBID 처리 및 환불 처리
        if (currentWinner != null && !currentWinner.getId().equals(userId)) {
            MyBids old = myBidsRepository.findByUserIdAndAuctionId(currentWinner.getId(), auctionId)
                    .orElseThrow(() -> new UserNotFoundException(currentWinner.getId()));

            long refund = old.getLastBidPrice();

            if (refund > 0) {
                pointService.changePoint(currentWinner.getId(), +refund, PointLedgerType.REFUND,
                        PointLedgerSource.AUCTION, auctionId, "경매 선두 변경 환불");
            }
            old.markOutBid();
        }

        // 해당 유저의 상태를 LEADING 으로 갱신
        myBids.updateLastBidPrice(dto.getPrice());
        myBids.markLeadBid();

        auction.updateCurrentWinner(user);

        // 입찰 기록 저장
        Bids bids = bidsRepository.save(Bids.from(createBidsDto));

        AuctionDocument auctionDocument = AuctionDocument.from(auction, auction.getMainImagKey());
        auctionElasticSearchRepository.save(auctionDocument);

        return BidsResponseDto.from(bids);
    }

    /**
     * 입찰 취소
     */
    @DistributedLock(key = "auction:#{#auctionId}")
    public void cancelBid(Long userId, Long auctionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionNotFoundException(auctionId));

        if (auction.getAuctionStatus() != AuctionStatus.RUNNING) {
            throw new EndedAuctionException(auction.getAuctionStatus());
        }

        MyBids myBids = myBidsRepository.findByUserIdAndAuctionId(user.getId(), auction.getId())
                .orElseThrow(() -> new IllegalArgumentException("취소할 입찰이 없습니다."));

        long refund = myBids.getLastBidPrice() == null ? 0 : myBids.getLastBidPrice();

        if (refund > 0) {
            pointService.changePoint(userId, +refund,
                    PointLedgerType.REFUND, PointLedgerSource.AUCTION,
                    auctionId, "입찰 취소 환불");
        }

        if (myBids.getMyAuctionState() == MyAuctionStatus.LEADING) {
            Optional<MyBids> topMyBids = myBidsRepository.findTopByAuctionId(auction.getId());

            if (topMyBids.isPresent()) {
                MyBids myBidsTop = topMyBids.get();
                User newWinner = myBidsTop.getUser();

                auction.updateCurrentWinner(newWinner);
                auction.updateCurrentPrice(myBidsTop.getLastBidPrice());

                myBidsTop.markLeadBid();
            } else {
                auction.updateCurrentWinner(null);
                auction.updateCurrentPrice(auction.getCurrentPrice());
            }
        }

        AuctionDocument auctionDocument = AuctionDocument.from(auction, auction.getMainImagKey());
        auctionElasticSearchRepository.save(auctionDocument);
    }



    public List<Bids> getBidsByUser(Long userId) {
        return bidsRepository.findAllByUserId(userId);
    }

    public List<Bids> getBidsByAuctionId(Long auctionId) {
        return bidsRepository.findByAuctionIdOrderByCreateTimeAsc(auctionId);
    }

}