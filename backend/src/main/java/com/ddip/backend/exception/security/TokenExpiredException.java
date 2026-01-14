package com.ddip.backend.exception.security;

import com.ddip.backend.exception.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super("TOKEN_EXPIRED", ErrorCode.EXPIRED_TOKEN, detail);
    }
}
