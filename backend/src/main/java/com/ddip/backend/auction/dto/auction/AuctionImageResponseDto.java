package com.ddip.backend.auction.dto.auction;

import com.ddip.backend.auction.domain.AuctionImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionImageResponseDto {

    private Long id;

    private String key;

    public static AuctionImageResponseDto from(AuctionImage auctionImage) {
        return AuctionImageResponseDto.builder()
                .id(auctionImage.getId())
                .key(auctionImage.getS3Key())
                .build();
    }
}
