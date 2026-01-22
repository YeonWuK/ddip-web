package com.ddip.backend.dto.es;

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

    private String imageKey;

    private String seller;

    private String description;

    private Long startPrice;

    private Long currentPrice;

    private String status;

    private LocalDateTime startAt;

    private LocalDateTime endAt;
}
