package com.ddip.backend.project.exception.pledge;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class PledgeAccessDeniedException extends BusinessException {

    public PledgeAccessDeniedException(Long pledgeId, Long userId) {
        super(ErrorCode.FORBIDDEN, "본인의 후원만 접근할 수 있습니다. pledgeId=" + pledgeId + ", userId=" + userId);
    }

}