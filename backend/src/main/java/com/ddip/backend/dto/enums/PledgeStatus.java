package com.ddip.backend.dto.enums;

public enum PledgeStatus {
    PENDING,    // 결제 전
    PAID,       // 결제 완료(펀딩 성공 전)
    CONFIRMED,  // 펀딩 성공 확정
    SHIPPED,    // 배송중
    CANCELED   // 취소됨
}