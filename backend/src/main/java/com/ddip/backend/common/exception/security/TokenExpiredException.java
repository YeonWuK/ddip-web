package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

public class TokenExpiredException extends CustomAuthenticationException {
    public TokenExpiredException(String detail) {
        super(ErrorCode.EXPIRED_TOKEN, detail);
    }
}
