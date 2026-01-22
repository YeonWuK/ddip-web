package com.ddip.backend.exception.pledge;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class PledgeAccessDeniedException extends BusinessException {

    public PledgeAccessDeniedException(Long pledgeId, Long userId) {
        super(ErrorCode.FORBIDDEN, "본인의 후원만 접근할 수 있습니다. pledgeId=" + pledgeId + ", userId=" + userId);
    }

}