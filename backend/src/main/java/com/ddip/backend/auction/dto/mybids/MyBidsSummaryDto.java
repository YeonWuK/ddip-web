package com.ddip.backend.auction.dto.mybids;

import com.ddip.backend.auction.dto.auction.AuctionSummaryDto;
import com.ddip.backend.auction.dto.enums.MyAuctionStatus;
import com.ddip.backend.auction.domain.MyBids;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyBidsSummaryDto {

    private Long id;

    private Long auctionId;

    private MyAuctionStatus myAuctionStatus;

    private long lastBidPrice;

    private AuctionSummaryDto auctionSummary;

    public static MyBidsSummaryDto from(MyBids myBids, AuctionSummaryDto auctionSummary) {
        return MyBidsSummaryDto.builder()
                .id(myBids.getId())
                .auctionId(myBids.getAuctionId())
                .lastBidPrice(myBids.getLastBidPrice())
                .myAuctionStatus(myBids.getMyAuctionState())
                .auctionSummary(auctionSummary)
                .build();
    }

}