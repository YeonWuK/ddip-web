package com.ddip.backend.exception.security;

import com.ddip.backend.exception.common.ErrorCode;

import lombok.Getter;
import org.springframework.security.access.AccessDeniedException;

@Getter
public class CustomAccessDeniedException extends AccessDeniedException {

    private final ErrorCode errorCode;
    private final String detail;

    public CustomAccessDeniedException(String msg, ErrorCode errorCode, String detail) {
        super(msg);
        this.errorCode = errorCode;
        this.detail = detail;
    }
}