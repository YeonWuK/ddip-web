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

        long minPrice = auction.getCurrentPrice() + auction.getBidStep();

        if (dto.getPrice() == null || dto.getPrice() < minPrice) {
            throw new InvalidBidStepException(dto.getPrice());
        }

        auction.updateCurrentPrice(dto.getPrice());

        CreateBidsDto createBidsDto = new CreateBidsDto(user, auction, dto.getPrice());

        CreateMyBidsDto createMyBidsDto = new CreateMyBidsDto(user, auction, dto.getPrice());

        MyBids myBids = myBidsRepository.findByUserIdAndAuctionId(userId, auctionId)
                        .orElseGet(() -> MyBids.from(createMyBidsDto));

        User currentWinner = auction.getCurrentWinner();

        if (currentWinner != null && !currentWinner.getId().equals(userId)) {
            MyBids old = myBidsRepository.findByUserIdAndAuctionId(currentWinner.getId(), auctionId)
                    .orElseThrow(() -> new UserNotFoundException(currentWinner.getId()));
            old.markOutBid();
        }

        myBids.updateLastBidPrice(dto.getPrice());
        myBids.markLeadBid();

        myBidsRepository.save(myBids);

        auction.updateCurrentWinner(user);

        Bids bids = Bids.from(createBidsDto);

        Bids saved = bidsRepository.save(bids);
        return BidsResponseDto.from(saved);
    }
}