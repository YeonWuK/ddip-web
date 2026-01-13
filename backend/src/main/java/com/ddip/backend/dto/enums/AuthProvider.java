package com.ddip.backend.dto.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuthProvider {
    GOOGLE,
    NAVER,
    KAKAO,
    LOCAL
}