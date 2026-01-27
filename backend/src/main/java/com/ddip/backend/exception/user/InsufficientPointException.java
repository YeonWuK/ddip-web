package com.ddip.backend.exception.user;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class InsufficientPointException extends BusinessException {

    public InsufficientPointException(Long userId, long required, long current) {
        super(ErrorCode.INSUFFICIENT_POINT,  "포인트 부족: userId=,"+ userId+ " 필요 금액= "+ required + " 보유 포인트= "+ current);
    }

}
