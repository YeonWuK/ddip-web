package com.ddip.backend.auction.dto.auction;

import com.ddip.backend.auction.dto.enums.AuctionStatus;
import com.ddip.backend.user.dto.user.UserResponseDto;
import com.ddip.backend.auction.domain.Auction;
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

    private String mainImageKey;

    private UserResponseDto seller;

    private UserResponseDto winner;

    private Long startPrice;

    private Long currentPrice;

    private int bidStep;

    private AuctionStatus auctionStatus;

    private List<AuctionImageResponseDto> images = new ArrayList<>();

    private LocalDateTime startAt;

    private String endAt;

    public static AuctionResponseDto from(Auction auction) {
        return AuctionResponseDto.builder()
                .auctionId(auction.getId())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .mainImageKey(auction.getMainImagKey())
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
                .build();
    }

}