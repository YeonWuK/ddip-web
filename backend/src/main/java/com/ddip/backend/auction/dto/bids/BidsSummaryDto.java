package com.ddip.backend.auction.dto.bids;

import com.ddip.backend.auction.dto.auction.AuctionSummaryDto;
import com.ddip.backend.user.dto.user.UserResponseDto;
import com.ddip.backend.auction.domain.Bids;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidsSummaryDto {

    private Long id;

    private UserResponseDto user;

    private Long auctionId;

    private Long price;

    private AuctionSummaryDto auctionSummary;

    public static BidsSummaryDto from(Bids bids, AuctionSummaryDto auctionSummary) {
        return BidsSummaryDto.builder()
                .id(bids.getId())
                .user(UserResponseDto.from(bids.getUser()))
                .auctionId(bids.getAuctionId())
                .price(bids.getPrice())
                .auctionSummary(auctionSummary)
                .build();
    }
}