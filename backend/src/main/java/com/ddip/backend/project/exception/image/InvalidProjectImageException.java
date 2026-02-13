package com.ddip.backend.project.exception.image;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class InvalidProjectImageException extends BusinessException {
    public InvalidProjectImageException(String message) {
        super(ErrorCode.INVALID_REQUEST, message);
    }
}
