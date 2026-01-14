package com.ddip.backend.exception.reward;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class InvalidQuantityException extends BusinessException {

    public InvalidQuantityException(Integer quantity) {
        super(ErrorCode.INVALID_REQUEST, "수량은 1 이상이어야 합니다. quantity=" + quantity);
    }

}