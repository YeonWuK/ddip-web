package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

public class BlackListedTokenException extends CustomAuthenticationException {
    public BlackListedTokenException(String detail) {
        super(ErrorCode.BLACKLISTED_TOKEN, detail);
    }
}
