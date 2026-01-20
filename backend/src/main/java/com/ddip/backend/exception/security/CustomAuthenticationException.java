package com.ddip.backend.exception.security;

import com.ddip.backend.exception.common.ErrorCode;

import lombok.Getter;
import org.springframework.security.core.AuthenticationException;

@Getter
public class CustomAuthenticationException extends AuthenticationException {

    private final ErrorCode errorCode;
    private final String detail;

    public CustomAuthenticationException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
        this.detail = detail;
    }
}