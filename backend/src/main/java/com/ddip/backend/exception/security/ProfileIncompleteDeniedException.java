package com.ddip.backend.exception.security;

import com.ddip.backend.exception.ErrorCode;

public class ProfileIncompleteDeniedException extends CustomAccessDeniedException {
    public ProfileIncompleteDeniedException(String detail) {
        super(ErrorCode.PROFILE_INCOMPLETE, detail);
    }
}