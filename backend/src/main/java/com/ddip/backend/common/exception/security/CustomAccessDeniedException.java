package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

import lombok.Getter;
import org.springframework.security.access.AccessDeniedException;

@Getter
public class CustomAccessDeniedException extends AccessDeniedException {

    private final ErrorCode errorCode;
    private final String detail;

    public CustomAccessDeniedException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
        this.detail = detail;
    }
}