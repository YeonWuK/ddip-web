package com.ddip.backend.common.exception.security;

import com.ddip.backend.common.exception.ErrorCode;

public class ProfileIncompleteDeniedException extends CustomAccessDeniedException {
    public ProfileIncompleteDeniedException(String detail) {
        super(ErrorCode.PROFILE_INCOMPLETE, detail);
    }
}