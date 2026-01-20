package com.ddip.backend.exception.user;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class InSufficientDdipPointsException extends BusinessException {
    public InSufficientDdipPointsException(long price, long required) {
        super(ErrorCode.INSUFFICIENT_DDIP_POINTS, "DDIP 포인트 부족: required: " + required + ", balance: " +  price);
    }
}
