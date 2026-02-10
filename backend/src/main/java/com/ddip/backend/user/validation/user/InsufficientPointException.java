package com.ddip.backend.user.validation.user;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class InsufficientPointException extends BusinessException {

    public InsufficientPointException(Long userId, long required, long current) {
        super(ErrorCode.INSUFFICIENT_POINT,  "포인트 부족: userId=,"+ userId+ " 필요 금액= "+ required + " 보유 포인트= "+ current);
    }

}
