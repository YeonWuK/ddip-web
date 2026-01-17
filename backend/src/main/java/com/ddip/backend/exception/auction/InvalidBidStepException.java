package com.ddip.backend.exception.auction;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class InvalidBidStepException extends BusinessException {
    public InvalidBidStepException(Long price) {
        super(ErrorCode.INVALID_REQUEST, "최소 경매 금액에 맞게 입력해야 합니다. price: " + price);
    }
}
