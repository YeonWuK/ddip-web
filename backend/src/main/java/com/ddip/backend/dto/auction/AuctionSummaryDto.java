package com.ddip.backend.dto.auction;

import com.ddip.backend.entity.Auction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionSummaryDto {

    private String title;

    private Long currentPrice;

    public static AuctionSummaryDto from(Auction auction) {
        return AuctionSummaryDto.builder()
                .title(auction.getTitle())
                .currentPrice(auction.getCurrentPrice())
                .build();
    }
}
