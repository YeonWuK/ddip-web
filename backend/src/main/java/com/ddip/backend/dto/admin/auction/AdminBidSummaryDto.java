package com.ddip.backend.dto.admin.auction;

import com.ddip.backend.entity.Bids;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBidSummaryDto {

    private Long bidId;

    // 입찰자
    private Long userId;
    private String username;

    // 경매
    private Long auctionId;

    // 입찰 금액
    private Long price;

    // 입찰 시간
    private LocalDateTime createdAt;

    public static AdminBidSummaryDto from(Bids bids) {
        return AdminBidSummaryDto.builder()
                .bidId(bids.getId())

                .userId(bids.getUser().getId())
                .username(bids.getUser().getUsername())

                .auctionId(bids.getAuction().getId())

                .price(bids.getPrice())
                .createdAt(bids.getCreateTime())
                .build();
    }
}