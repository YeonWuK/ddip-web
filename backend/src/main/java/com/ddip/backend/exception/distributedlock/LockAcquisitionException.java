package com.ddip.backend.exception.distributedlock;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class LockAcquisitionException extends BusinessException {
    public LockAcquisitionException(String key) {
        super(ErrorCode.LOCK_NOT_AVAILABLE, "key: " + key);
    }
}
