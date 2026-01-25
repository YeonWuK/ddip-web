package com.ddip.backend.service;

import com.ddip.backend.dto.admin.auction.AdminAuctionSearchCondition;
import com.ddip.backend.dto.auction.AuctionRequestDto;
import com.ddip.backend.dto.auction.AuctionResponseDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.MyBids;
import com.ddip.backend.entity.User;
import com.ddip.backend.es.document.AuctionDocument;
import com.ddip.backend.es.repository.AuctionElasticSearchRepository;
import com.ddip.backend.exception.auction.AuctionDeniedException;
import com.ddip.backend.dto.auction.AuctionEndedEventDto;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.exception.auction.InvalidBidStepException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.MyBidsRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final AuctionRepository auctionRepository;
    private final MyBidsRepository myBidsRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionElasticSearchRepository auctionEsRepository;

    /**
     * 경매 생성
     */
    public AuctionResponseDto createAuction(Long userId, AuctionRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        validateBidStep(dto.getStartPrice(), dto.getBidStep());

        Auction auction = Auction.from(user, dto);
        auctionRepository.save(auction);

        // Es 인덱스 생성
        AuctionDocument auctionDocument = AuctionDocument.from(auction);
        auctionEsRepository.save(auctionDocument);

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


    @Scheduled(cron = "0 * * * * *")
    public void endExpiredAuction() {
        LocalDateTime now = LocalDateTime.now();

        List<Auction> auctions = auctionRepository.findEndAuctions(now, 100);

        for (Auction auction : auctions) {

            if (auction.getAuctionStatus() != AuctionStatus.RUNNING) {
                continue;
            }

            // 낙찰자는 MyBids 의 LEADING 1건으로 결정
            Optional<MyBids> Users = myBidsRepository.findLeadingByAuctionId(auction.getId());

            if (Users.isPresent()) {
                MyBids leading = Users.get();
                User winner = leading.getUser();

                auction.updateWinner(winner);

                // 낙찰자 유저 제외 모든 유저 LOST 로 변경
                myBidsRepository.markWon(auction.getId(), winner.getId());
                myBidsRepository.markLostExceptWinner(auction.getId(), winner.getId());

            }

            // 경매 종료
            auction.updateAuctionStatus(AuctionStatus.ENDED);

            // 프론트에 STOMP 로 알림
            AuctionEndedEventDto dto = AuctionEndedEventDto.from(auction);
            messagingTemplate.convertAndSend("/topic/auction/" + auction.getId(), dto);
        }
    }

    /**
     * 최저 입찰가 검증
     */
    private void validateBidStep(Long startPrice, int bidStep) {
        if (startPrice == null || startPrice <= 0) {
            throw new InvalidBidStepException(bidStep);
        }
        if (bidStep <= 0) {
            throw new InvalidBidStepException(bidStep);
        }

        long required;
        if (startPrice < 1_000_000L) {
            required = percentCeil(startPrice, 5);
        } else {
            required = percentCeil(startPrice, 10);
        }

        if (bidStep < required) {
            throw new InvalidBidStepException(bidStep);
        }
    }

    private long percentCeil(long value, int percent) {
        return (value * percent + 99) / 100;
    }

    public List<Auction> getAuctionsBySeller(Long sellerId) {
        return auctionRepository.findAuctionsByUserId(sellerId);
    }

    public Auction getAuctionById(Long auctionId) {
        return auctionRepository.findById(auctionId).orElseThrow(() -> new AuctionNotFoundException(auctionId));
    }

    @Transactional(readOnly = true)
    public Page<Auction> searchAuctionsForAdmin(AdminAuctionSearchCondition condition, Pageable pageable) {
        return auctionRepository.searchAuctionsForAdmin(condition, pageable);
    }

}