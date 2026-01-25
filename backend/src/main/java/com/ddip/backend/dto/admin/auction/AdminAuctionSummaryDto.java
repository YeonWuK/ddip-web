package com.ddip.backend.dto.admin.auction;

import com.ddip.backend.entity.Auction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuctionSummaryDto {

    private Long id;

    // 판매자
    private Long sellerId;
    private String sellerUsername;

    // 현재 낙찰 후보
    private Long currentWinnerId;
    private String currentWinnerUsername;

    private String title;

    private Long startPrice;
    private Long currentPrice;
    private int bidStep;

    private String auctionStatus;

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;

    public static AdminAuctionSummaryDto from(Auction auction) {
        return AdminAuctionSummaryDto.builder()
                .id(auction.getId())

                .sellerId(auction.getSeller().getId())
                .sellerUsername(auction.getSeller().getUsername())

                .currentWinnerId(auction.getCurrentWinner().getId())
                .currentWinnerUsername(auction.getCurrentWinner() != null ? auction.getCurrentWinner().getUsername() : null)

                .title(auction.getTitle())
                .startPrice(auction.getStartPrice())
                .currentPrice(auction.getCurrentPrice())
                .bidStep(auction.getBidStep())
                .auctionStatus(auction.getAuctionStatus().name())

                .startAt(auction.getStartAt())
                .endAt(auction.getEndAt())
                .createdAt(auction.getCreateTime())
                .build();
    }

}