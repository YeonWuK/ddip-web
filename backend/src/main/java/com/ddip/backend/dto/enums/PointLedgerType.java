package com.ddip.backend.dto.enums;

public enum PointLedgerType {
    CHARGE,     // 유료 충전
    USE,        // 사용 (후원 결제, 경매 결제 등)
    REFUND,     // 환불
    ADJUST      // 관리자 보정/정정
}