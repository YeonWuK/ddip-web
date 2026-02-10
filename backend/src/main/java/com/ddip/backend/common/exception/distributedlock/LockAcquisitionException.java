package com.ddip.backend.common.exception.distributedlock;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class LockAcquisitionException extends BusinessException {
    public LockAcquisitionException(String key) {
        super(ErrorCode.LOCK_NOT_AVAILABLE, "key: " + key);
    }
}
