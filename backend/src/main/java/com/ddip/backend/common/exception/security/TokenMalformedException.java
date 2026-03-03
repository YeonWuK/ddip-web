package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

public class TokenMalformedException extends CustomAuthenticationException{
    public TokenMalformedException(String detail) {
        super(ErrorCode.INVALID_TOKEN, detail);
    }
}
