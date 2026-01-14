package com.ddip.backend.dto.exception.security;

import com.ddip.backend.exception.common.ErrorCode;

public class ProfileIncompleteDeniedException extends CustomAccessDeniedException {
    public ProfileIncompleteDeniedException(String detail) {
        super("PROFILE_INCOMPLETE", ErrorCode.PROFILE_INCOMPLETE, detail);
    }
}