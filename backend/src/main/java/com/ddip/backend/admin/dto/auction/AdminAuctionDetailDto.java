package com.ddip.backend.admin.dto.auction;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuctionDetailDto {

    private Long id;

    // 판매자
    private Long sellerId;
    private String sellerUsername;

    // 최종 낙찰자
    private Long winnerId;
    private String winnerUsername;

    // 현재 최고 입찰자
    private Long currentWinnerId;
    private String currentWinnerUsername;

    private String title;
    private String description;

    private Long startPrice;
    private Long currentPrice;
    private int bidStep;

    private String auctionStatus;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;

    // 입찰 내역
    private List<AdminBidSummaryDto> bids;

    public static AdminAuctionDetailDto of(Auction auction, List<AdminBidSummaryDto> bids) {
        User winner = auction.getWinner();
        User currentWinner = auction.getCurrentWinner();

        return AdminAuctionDetailDto.builder()
                .id(auction.getId())

                .sellerId(auction.getSeller().getId())
                .sellerUsername(auction.getSeller().getUsername())

                .winnerId(winner != null ? winner.getId() : null)
                .winnerUsername(winner != null ? winner.getUsername() : null)

                .currentWinnerId(currentWinner != null ? currentWinner.getId() : null)
                .currentWinnerUsername(currentWinner != null ? currentWinner.getUsername() : null)

                .title(auction.getTitle())
                .description(auction.getDescription())
                .startPrice(auction.getStartPrice())
                .currentPrice(auction.getCurrentPrice())
                .bidStep(auction.getBidStep())
                .auctionStatus(auction.getAuctionStatus().name())

                .startAt(auction.getStartAt())
                .endAt(auction.getEndAt())
                .createdAt(auction.getCreateTime())

                .bids(bids)
                .build();
    }
}
