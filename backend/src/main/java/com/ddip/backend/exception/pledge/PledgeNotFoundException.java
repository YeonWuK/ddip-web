package com.ddip.backend.exception.pledge;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class PledgeNotFoundException extends BusinessException {

    public PledgeNotFoundException(Long pledgeId) {
        super(ErrorCode.NOT_FOUND, "존재하지 않는 후원입니다. pledgeId=" + pledgeId);
    }

}