package com.ddip.backend.dto.bids;

import com.ddip.backend.dto.auction.AuctionSummaryDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.entity.Bids;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidsResponseDto {

    private Long id;

    private UserResponseDto user;

    private AuctionSummaryDto auction;

    private Long price;

    public static BidsResponseDto from(Bids bids) {
        return BidsResponseDto.builder()
                .id(bids.getId())
                .user(UserResponseDto.from(bids.getUser()))
                .auction(AuctionSummaryDto.from(bids.getAuction()))
                .price(bids.getPrice())
                .build();
    }
}