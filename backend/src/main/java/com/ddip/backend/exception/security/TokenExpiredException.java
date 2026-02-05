package com.ddip.backend.exception.security;

import com.ddip.backend.exception.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super(ErrorCode.EXPIRED_TOKEN, detail);
    }
}
