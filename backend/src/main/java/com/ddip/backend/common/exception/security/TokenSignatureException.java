package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

public class TokenSignatureException extends CustomAuthenticationException{
    public TokenSignatureException(String detail) {
        super(ErrorCode.INVALID_TOKEN, detail);
    }
}
