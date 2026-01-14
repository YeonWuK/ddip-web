package com.ddip.backend.dto.exception.security;

import com.ddip.backend.exception.common.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super("TOKEN_EXPIRED", ErrorCode.EXPIRED_TOKEN, detail);
    }
}
