package com.ddip.backend.auction.dto.auction;

import com.ddip.backend.auction.dto.bids.BidsResponseDto;
import com.ddip.backend.auction.dto.enums.AuctionStatus;
import com.ddip.backend.user.dto.user.UserResponseDto;
import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.domain.Bids;
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
public class AuctionDetailResponseDto {

    private Long auctionId;

    private String title;

    private String description;

    private UserResponseDto seller;

    private UserResponseDto winner;

    private Long startPrice;

    private Long currentPrice;

    private int bidStep;

    private AuctionStatus auctionStatus;

    private List<AuctionImageResponseDto> images = new ArrayList<>();

    private LocalDateTime startAt;

    private String endAt;

    private List<BidsResponseDto> bids = new ArrayList<>();

    public static AuctionDetailResponseDto from(Auction auction, List<Bids> bids) {
        return AuctionDetailResponseDto.builder()
                .auctionId(auction.getId())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .seller(UserResponseDto.from(auction.getSeller()))
                .winner(auction.getWinner() == null ? null : UserResponseDto.from(auction.getWinner()))
                .startPrice(auction.getStartPrice())
                .currentPrice(auction.getCurrentPrice())
                .bidStep(auction.getBidStep())
                .auctionStatus(auction.getAuctionStatus())
                .images(auction.getImages().stream()
                        .map(AuctionImageResponseDto::from)
                        .collect(Collectors.toList()))
                .startAt(auction.getStartAt())
                .endAt(String.valueOf(auction.getEndAt()))
                .bids(bids.stream()
                        .map(BidsResponseDto::from)
                        .collect(Collectors.toList()))
                .build();
    }

}