package com.ddip.backend.exception.user;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class UserNotFoundException extends BusinessException {

    public UserNotFoundException(Long userId) {
        super(ErrorCode.USER_NOT_FOUND, "존재하지 않는 사용자입니다. userId=" + userId);
    }

    public UserNotFoundException(String email) {
        super(ErrorCode.USER_NOT_FOUND, "존재하지 않는 사용자입니다. email=" + email);
    }

}