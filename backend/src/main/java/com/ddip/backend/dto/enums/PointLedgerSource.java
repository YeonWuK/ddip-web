package com.ddip.backend.dto.enums;

public enum PointLedgerSource {
    PLEDGE,     // 크라우드 펀딩
    AUCTION,    // 경매
    CHARGE,     // 충전
    ADMIN,      // 관리자 수동 조정
    EVENT       // 이벤트/프로모션
}