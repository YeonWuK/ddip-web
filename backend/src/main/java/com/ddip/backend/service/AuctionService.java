package com.ddip.backend.service;

import com.ddip.backend.dto.auction.AuctionRequestDto;
import com.ddip.backend.dto.auction.AuctionResponseDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.Bids;
import com.ddip.backend.entity.MyBids;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.auction.AuctionDeniedException;
import com.ddip.backend.dto.auction.AuctionEndedEventDto;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.exception.auction.InvalidBidStepException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.BidsRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AuctionService {

    private final UserRepository userRepository;
    private final BidsRepository bidsRepository;
    private final AuctionRepository auctionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 경매 생성
     */
    public AuctionResponseDto createAuction(Long userId, AuctionRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        validateBidStep(dto.getStartPrice(), dto.getBidStep());

        Auction auction = Auction.from(user, dto);
        auctionRepository.save(auction);

        return AuctionResponseDto.from(auction);
    }

    /**
     * 경매 상세 조회
     */
    @Transactional(readOnly = true)
    public AuctionResponseDto getAuction(Long auctionId) {
        Auction auction = auctionRepository.findDetailById(auctionId)
                .orElseThrow(() -> new AuctionNotFoundException(auctionId));

        return AuctionResponseDto.from(auction);
    }

    /**
     * 모든 경매 조회
     */
    @Transactional(readOnly = true)
    public List<AuctionResponseDto> getAllAuctions() {
        return auctionRepository.findAllByOrderByIdDesc().stream()
                .map(AuctionResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * 경매 삭제
     */
    public void deleteAuction(Long auctionId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new AuctionNotFoundException(auctionId));

        if(!auction.getSeller().equals(user)) {
            throw new AuctionDeniedException(auctionId, userId);
        }

        auctionRepository.delete(auction);
    }


    /**
     * 경매 종료(1분마다 확인)
     */
    @Scheduled(cron = "0 * * * * *")
    public void endExpiredAuction() {
        LocalDateTime now = LocalDateTime.now();

        List<Auction> auctions = auctionRepository.findEndAuctions(now, 100);

        for (Auction auction : auctions) {

            if (auction.getAuctionStatus() != AuctionStatus.RUNNING) {
                continue;
            }

            // 가장 높은 입찰가 조회
            Optional<Bids> bids = bidsRepository.findTopBidByAuctionId(auction.getId());

            if (bids.isPresent()) {
                // 입찰자 선정
                Bids topBid = bids.get();
                auction.updateWinner(topBid.getUser());
            } else {
                auction.updateWinner(null);
            }

            Long winnerId = auction.getWinner() != null ? auction.getWinner().getId() : null;

            // 해당 경매 유저 경매 상태 변경
            for (MyBids myBids : auction.getMyBids()) {
                if (myBids.getUser().getId().equals(winnerId)) {
                    myBids.markWon();
                } else {
                    myBids.markLost();
                }
            }

            auction.updateAuctionStatus(AuctionStatus.ENDED);

            AuctionEndedEventDto dto = AuctionEndedEventDto.from(auction);

            // 경매 종료 응답 프론트에 STOMP로 보냄
            messagingTemplate.convertAndSend("/topic/auction/" + auction.getId(), dto);
        }
    }

    /**
     * 최저 입찰가 검증
     */
    private void validateBidStep(Long startPrice, int bidStep) {
        if (startPrice == null || startPrice <= 0) {
            throw new InvalidBidStepException((long) bidStep);
        }
        if (bidStep <= 0) {
            throw new InvalidBidStepException((long) bidStep);
        }

        long required;
        if (startPrice < 1_000_000L) {
            required = percentCeil(startPrice, 5);
        } else {
            required = percentCeil(startPrice, 10);
        }

        if (bidStep < required) {
            throw new InvalidBidStepException((long) bidStep);
        }
    }

    private long percentCeil(long value, int percent) {
        return (value * percent + 99) / 100;
    }
}