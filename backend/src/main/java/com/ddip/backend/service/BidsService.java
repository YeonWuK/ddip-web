package com.ddip.backend.service;

import com.ddip.backend.aop.DistributedLock;
import com.ddip.backend.dto.bids.BidsRequestDto;
import com.ddip.backend.dto.bids.BidsResponseDto;
import com.ddip.backend.dto.bids.CreateBidsDto;
import com.ddip.backend.dto.bids.CreateMyBidsDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.Bids;
import com.ddip.backend.entity.MyBids;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.exception.auction.EndedAuctionException;
import com.ddip.backend.exception.auction.InvalidBidStepException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.BidsRepository;
import com.ddip.backend.repository.MyBidsRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.aspectj.runtime.internal.Conversions.intValue;

@Service
@Transactional
@RequiredArgsConstructor
public class BidsService {

    private final BidsRepository bidsRepository;
    private final UserRepository userRepository;
    private final MyBidsRepository myBidsRepository;
    private final AuctionRepository auctionRepository;

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

        // 입찰 최저가 + 현 입찰가
        long minPrice = auction.getCurrentPrice() + auction.getBidStep();

        if (dto.getPrice() < minPrice) {
            throw new InvalidBidStepException(intValue(dto.getPrice()));
        }

        // 입찰가 갱신 요청 값으로 갱신
        auction.updateCurrentPrice(dto.getPrice());

        CreateBidsDto createBidsDto = new CreateBidsDto(user, auction, dto.getPrice());

        CreateMyBidsDto createMyBidsDto = new CreateMyBidsDto(user, auction, dto.getPrice());

        // 해당 유저의 MyBids 가 없으면 생성, 있으면 갱신
        MyBids myBids = myBidsRepository.findByUserIdAndAuctionId(userId, auctionId)
                        .orElseGet(() -> MyBids.from(createMyBidsDto));

        myBidsRepository.save(myBids);

        User currentWinner = auction.getCurrentWinner();

        // 기존 선두가 있으면 OUTBID 처리
        if (currentWinner != null && !currentWinner.getId().equals(userId)) {
            MyBids old = myBidsRepository.findByUserIdAndAuctionId(currentWinner.getId(), auctionId)
                    .orElseThrow(() -> new UserNotFoundException(currentWinner.getId()));
            old.markOutBid();
        }

        // 해당 유저의 상태를 LEADING 으로 갱신
        myBids.updateLastBidPrice(dto.getPrice());
        myBids.markLeadBid();

        // 경매의 현재 선두 갱신
        auction.updateCurrentWinner(user);

        // 입찰 기록 저장
        Bids bids = bidsRepository.save(Bids.from(createBidsDto));

        return BidsResponseDto.from(bids);
    }
}