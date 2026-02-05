package com.ddip.backend.exception.auction;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class InvalidBidStepException extends BusinessException {
    public InvalidBidStepException(int price) {
        super(ErrorCode.INVALID_REQUEST, "최소 경매 금액에 맞게 입력해야 합니다. price: " + price);
    }
}
