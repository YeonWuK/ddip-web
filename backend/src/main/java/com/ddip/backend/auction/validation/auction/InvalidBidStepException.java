package com.ddip.backend.auction.validation.auction;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class InvalidBidStepException extends BusinessException {
    public InvalidBidStepException(int price) {
        super(ErrorCode.INVALID_REQUEST, "최소 경매 금액에 맞게 입력해야 합니다. price: " + price);
    }
}
