package com.ddip.backend.auction.service;

import com.ddip.backend.auction.event.AuctionUpdateEvent;
import com.ddip.backend.billing.service.PointService;
import com.ddip.backend.common.aop.DistributedLock;
import com.ddip.backend.auction.dto.bids.BidsRequestDto;
import com.ddip.backend.auction.dto.bids.BidsResponseDto;
import com.ddip.backend.auction.dto.bids.CreateBidsDto;
import com.ddip.backend.auction.dto.bids.CreateMyBidsDto;
import com.ddip.backend.auction.dto.enums.AuctionStatus;
import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.domain.Bids;
import com.ddip.backend.auction.domain.MyBids;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.auction.event.AuctionEsEvent;
import com.ddip.backend.auction.validation.auction.AuctionNotFoundException;
import com.ddip.backend.auction.validation.auction.EndedAuctionException;
import com.ddip.backend.auction.validation.auction.InvalidBidStepException;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import com.ddip.backend.auction.repository.AuctionRepository;
import com.ddip.backend.auction.repository.BidsRepository;
import com.ddip.backend.auction.repository.MyBidsRepository;
import com.ddip.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

    private final PointService pointService;
    private final ApplicationEventPublisher publisher;

    /**
     * 경매 참여
     */
    @DistributedLock(key = "'auction:' + #auctionId")
    public void createBid(Long userId, Long auctionId, BidsRequestDto dto) {

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

        CreateBidsDto createBidsDto = new CreateBidsDto(user, auctionId, dto.getPrice());

        CreateMyBidsDto createMyBidsDto = new CreateMyBidsDto(user, auction.getId());

        // 해당 유저의 MyBids 가 없으면 생성, 있으면 갱신
        MyBids myBids = myBidsRepository.findByUserIdAndAuctionId(userId, auctionId)
                .orElseGet(() -> myBidsRepository.save(MyBids.from(createMyBidsDto)));

        User currentWinner = auction.getCurrentWinner();

        // 동일 유저면 입찰가 증분 차감
        if (currentWinner != null && currentWinner.getId().equals(userId)) {

            long prevHold = myBids.getLastBidPrice() == null ? 0L : myBids.getLastBidPrice();
            long newPrice = dto.getPrice() - prevHold;

            pointService.changePoint(userId, -newPrice,
                    PointLedgerType.USE, PointLedgerSource.AUCTION, auctionId, "경매 재입찰");

            myBids.updateLastBidPrice(dto.getPrice());

            auction.updateCurrentPrice(dto.getPrice());



        } else {

            // 이전 입찰 유저 포인트 환불
            if (currentWinner != null) {
                MyBids old = myBidsRepository.findByUserIdAndAuctionId(currentWinner.getId(), auctionId)
                        .orElseThrow(() -> new UserNotFoundException(currentWinner.getId()));

                long refund = old.getLastBidPrice() == null ? 0L : old.getLastBidPrice();

                if (refund > 0) {
                    pointService.changePoint(currentWinner.getId(), +refund,
                            PointLedgerType.REFUND, PointLedgerSource.AUCTION, auctionId, "경매 선두 변경 환불");
                }

                old.updateLastBidPrice(0L);
                old.markOutBid();
            }

            // 새로운 입찰
            pointService.changePoint(userId, -dto.getPrice(),
                    PointLedgerType.USE, PointLedgerSource.AUCTION, auctionId, "경매 입찰");

            myBids.updateLastBidPrice(dto.getPrice());
            myBids.markLeadBid();

            auction.updateCurrentWinner(user);
            auction.updateCurrentPrice(dto.getPrice());
        }

        Bids saved = bidsRepository.save(Bids.from(createBidsDto));

        // after commit
        publisher.publishEvent(new AuctionEsEvent(auction.getId()));
        publisher.publishEvent(new AuctionUpdateEvent(auction.getId(), saved.getId()));
    }

    public List<BidsResponseDto> getAllBids(Long auctionId) {
        return bidsRepository.findByAuctionId(auctionId).stream()
                .map(BidsResponseDto::from)
                .collect(Collectors.toList());
    }

    public Bids getBidsById(Long bidsId) {
        return bidsRepository.findById(bidsId)
                .orElseThrow(() -> new IllegalArgumentException("Bids Not Found Exception"));
    }

    public List<Bids> getBidsByUser(Long userId) {
        return bidsRepository.findAllByUserId(userId);
    }

    public List<Bids> getBidsByAuctionId(Long auctionId) {
        return bidsRepository.findByAuctionIdOrderByCreateTimeAsc(auctionId);
    }

}