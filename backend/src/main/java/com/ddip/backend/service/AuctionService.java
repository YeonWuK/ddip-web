package com.ddip.backend.service;

import com.ddip.backend.dto.auction.AuctionRequestDto;
import com.ddip.backend.dto.auction.AuctionResponseDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.AuctionImage;
import com.ddip.backend.entity.MyBids;
import com.ddip.backend.entity.User;
import com.ddip.backend.es.document.AuctionDocument;
import com.ddip.backend.es.repository.AuctionElasticSearchRepository;
import com.ddip.backend.exception.auction.AuctionDeniedException;
import com.ddip.backend.dto.auction.AuctionEndedEventDto;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.exception.auction.InvalidBidStepException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AuctionImageRepository;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.MyBidsRepository;
import com.ddip.backend.repository.UserRepository;
import com.ddip.backend.utils.AwsS3Util;
import com.ddip.backend.utils.S3UrlPrefixFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AuctionService {

    private final AwsS3Util awsS3Util;
    private final PointService pointService;
    private final S3UrlPrefixFactory s3UrlPrefixFactory;

    private final UserRepository userRepository;
    private final MyBidsRepository myBidsRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final AuctionElasticSearchRepository auctionEsRepository;

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 경매 생성
     */
    public AuctionResponseDto createAuction(List<MultipartFile> auctionFiles,
                                            Long userId, AuctionRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        validateBidStep(dto.getStartPrice(), dto.getBidStep());

        Auction auction = Auction.from(user, dto);
        auctionRepository.save(auction);

        String prefix = s3UrlPrefixFactory.auctionPrefix(auction.getId());

        // 이미지 다중 저장
        for (MultipartFile multipartFile : auctionFiles) {
            String key = awsS3Util.uploadFile(multipartFile, prefix);
            AuctionImage auctionImage = AuctionImage.from(auction, key);

            auctionImageRepository.save(auctionImage);
        }

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

        List<AuctionImage> auctionImages = auctionImageRepository.findImagesByAuctionId(auction.getId());

        // S3에 있는 이미지 삭제
        for (AuctionImage auctionImage : auctionImages) {
            awsS3Util.deleteByKey(auctionImage.getS3Key());
        }

        Long currentWinnerId = auction.getCurrentWinner().getId();

        if (currentWinnerId != null) {
            pointService.changePoint(currentWinnerId, +auction.getCurrentPrice(),
                    PointLedgerType.REFUND, PointLedgerSource.AUCTION,
                    auction.getId(), "경매 삭제 입찰자 환불");
        }

        auctionRepository.delete(auction);
    }


    /**
     * 경메 종료
     */
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

            pointService.changePoint(auction.getSeller().getId(), +auction.getCurrentPrice(),
                    PointLedgerType.CHARGE, PointLedgerSource.AUCTION,
                    auction.getId(), "경매 종료 판매자 입금");

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
}