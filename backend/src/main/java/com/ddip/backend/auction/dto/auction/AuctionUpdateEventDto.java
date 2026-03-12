package com.ddip.backend.auction.dto.auction;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.domain.Bids;
import com.ddip.backend.auction.dto.bids.BidsResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionUpdateEventDto {

    private AuctionResponseDto auctionResponseDto;

    private BidsResponseDto bidsResponseDto;

    public static AuctionUpdateEventDto from(Auction auction, Bids bids) {
        return AuctionUpdateEventDto.builder()
                .auctionResponseDto(AuctionResponseDto.from(auction))
                .bidsResponseDto(BidsResponseDto.from(bids))
                .build();
    }
}
