package com.ddip.backend.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {

    USER("ROLE_USER"),
    SOCIAL("ROLE_SOCIAL"),
    ADMIN("ROLE_ADMIN");

    private final String value;

}