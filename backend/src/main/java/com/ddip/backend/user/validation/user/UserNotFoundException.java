package com.ddip.backend.user.validation.user;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class UserNotFoundException extends BusinessException {

    public UserNotFoundException(Long userId) {
        super(ErrorCode.USER_NOT_FOUND, "존재하지 않는 사용자입니다. userId=" + userId);
    }

    public UserNotFoundException(String email) {
        super(ErrorCode.USER_NOT_FOUND, "존재하지 않는 사용자입니다. email=" + email);
    }

}