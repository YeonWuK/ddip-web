package com.ddip.backend.dto.auction;

import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.entity.Auction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionEndedEventDto {

    private Long auctionId;

    private AuctionStatus auctionStatus;

    private UserResponseDto user;

    private Long currentPrice;

    private String endAt;

    public static AuctionEndedEventDto from(Auction auction) {
        return AuctionEndedEventDto.builder()
                .auctionId(auction.getId())
                .auctionStatus(auction.getAuctionStatus())
                .user(UserResponseDto.from(auction.getWinner()))
                .currentPrice(auction.getCurrentPrice())
                .endAt(String.valueOf(auction.getEndAt()))
                .build();
    }
}