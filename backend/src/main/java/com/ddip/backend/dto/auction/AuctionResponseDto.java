package com.ddip.backend.dto.auction;

import com.ddip.backend.dto.bids.BidsSummaryDto;
import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.dto.enums.PaymentStatus;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.entity.Auction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionResponseDto {

    private Long auctionId;

    private String title;

    private String description;

    private UserResponseDto seller;

    private UserResponseDto winner;

    private Long startPrice;

    private Long currentPrice;

    private int bidStep;

    private AuctionStatus auctionStatus;

    private PaymentStatus paymentStatus;

    private LocalDateTime startAt;

    private String endAt;

    private List<BidsSummaryDto> bids = new ArrayList<>();

    public static AuctionResponseDto from(Auction auction) {
        return AuctionResponseDto.builder()
                .auctionId(auction.getId())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .seller(UserResponseDto.from(auction.getSeller()))
                .winner(auction.getWinner() == null ? null : UserResponseDto.from(auction.getWinner()))
                .startPrice(auction.getStartPrice())
                .currentPrice(auction.getCurrentPrice())
                .bidStep(auction.getBidStep())
                .auctionStatus(auction.getAuctionStatus())
                .paymentStatus(auction.getPaymentStatus())
                .startAt(auction.getStartAt())
                .endAt(String.valueOf(auction.getEndAt()))
                .bids(auction.getBids().stream()
                        .map(BidsSummaryDto::from)
                        .collect(Collectors.toList()))
                .build();
    }
}