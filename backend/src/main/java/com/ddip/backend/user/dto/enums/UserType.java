package com.ddip.backend.user.dto.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserType {

    VALUE_ORIENTED("가치지향형"),
    PRACTICAL_ORIENTED("실용지향형"),
    TREND_ORIENTED("트렌드지향형");

    private final String description;
}
