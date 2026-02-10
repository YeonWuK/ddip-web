package com.ddip.backend.project.validation.reward;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class InvalidQuantityException extends BusinessException {

    public InvalidQuantityException(long quantity) {
        super(ErrorCode.INVALID_REQUEST, "수량은 1 이상이어야 합니다. quantity=" + quantity);
    }

}