package com.ddip.backend.dto.exception.security;

import com.ddip.backend.dto.exception.ErrorCode;
import lombok.Getter;
import org.springframework.security.core.AuthenticationException;

@Getter
public class CustomAuthenticationException extends AuthenticationException {

    private final ErrorCode errorCode;
    private final String detail;

    public CustomAuthenticationException(String msg, ErrorCode errorCode, String detail) {
        super(msg);
        this.errorCode = errorCode;
        this.detail = detail;
    }
}