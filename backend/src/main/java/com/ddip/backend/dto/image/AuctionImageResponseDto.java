package com.ddip.backend.dto.image;

import com.ddip.backend.entity.AuctionImage;
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
