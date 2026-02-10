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

    private AuctionSummaryDto auction;

    private MyAuctionStatus myAuctionStatus;


    private long lastBidPrice;

    public static MyBidsSummaryDto from(MyBids myBids) {
        return MyBidsSummaryDto.builder()
                .id(myBids.getId())
                .auction(AuctionSummaryDto.from(myBids.getAuction()))
                .lastBidPrice(myBids.getLastBidPrice())
                .myAuctionStatus(myBids.getMyAuctionState())
                .build();
    }

}