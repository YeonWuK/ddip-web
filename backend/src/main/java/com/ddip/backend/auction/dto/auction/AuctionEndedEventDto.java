package com.ddip.backend.auction.dto.auction;

import com.ddip.backend.auction.dto.enums.AuctionStatus;
import com.ddip.backend.user.dto.user.UserResponseDto;
import com.ddip.backend.auction.domain.Auction;
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

    private String title;

    private AuctionStatus auctionStatus;

    private UserResponseDto user;

    private Long currentPrice;

    private String endAt;

    public static AuctionEndedEventDto from(Auction auction) {
        return AuctionEndedEventDto.builder()
                .auctionId(auction.getId())
                .title(auction.getTitle())
                .auctionStatus(auction.getAuctionStatus())
                .user(auction.getWinner() == null ? null : UserResponseDto.from(auction.getWinner()))
                .currentPrice(auction.getCurrentPrice())
                .endAt(String.valueOf(auction.getEndAt()))
                .build();
    }
}