package com.ddip.backend.exception.security;

import com.ddip.backend.exception.common.ErrorCode;

public class BlackListedTokenException extends CustomAuthenticationException {
    public BlackListedTokenException(String detail) {
        super(ErrorCode.BLACKLISTED_TOKEN, detail);
    }
}
