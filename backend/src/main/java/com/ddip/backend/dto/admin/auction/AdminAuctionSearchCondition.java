package com.ddip.backend.dto.admin.auction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuctionSearchCondition {

    private String title;              // 경매 제목 키워드
    private String sellerUsername;     // 판매자 username
    private String status;             // AuctionStatus

    // 기간 필터
    private LocalDateTime startFrom;   // start_at >=
    private LocalDateTime startTo;     // start_at <=

}