package com.ddip.backend.dto.auction;

import com.ddip.backend.dto.enums.AuctionStatus;
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
public class AuctionSummaryDto {

    private Long id;

    private String title;

    private Long currentPrice;

    private Long sellerId;

    private String seller;

    private AuctionStatus auctionStatus;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    public static AuctionSummaryDto from(Auction auction) {
        return AuctionSummaryDto.builder()
                .id(auction.getId())
                .title(auction.getTitle())
                .currentPrice(auction.getCurrentPrice())
                .sellerId(auction.getSeller().getId())
                .seller(auction.getSeller().getUsername())
                .auctionStatus(auction.getAuctionStatus())
                .startAt(auction.getStartAt())
                .endAt(auction.getEndAt())
                .build();
    }
}