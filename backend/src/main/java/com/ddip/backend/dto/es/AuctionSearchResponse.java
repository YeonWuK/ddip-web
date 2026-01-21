package com.ddip.backend.dto.es;

import com.ddip.backend.es.document.AuctionDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionSearchResponse {

    private Long id;

    private String title;

    private String seller;

    private Long startPrice;

    private Long currentPrice;

    private String status;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    public static AuctionSearchResponse from(AuctionDocument auctionDocument) {
        return AuctionSearchResponse.builder()
                .id(auctionDocument.getId())
                .title(auctionDocument.getTitle())
                .seller(auctionDocument.getSeller())
                .startPrice(auctionDocument.getStartPrice())
                .currentPrice(auctionDocument.getCurrentPrice())
                .status(auctionDocument.getStatus())
                .startAt(auctionDocument.getStartAt())
                .endAt(auctionDocument.getEndAt())
                .build();
    }
}
