package com.ddip.backend.common.exception.distributedlock;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class LockInterruptedException extends BusinessException {
    public LockInterruptedException(String key) {
        super(ErrorCode.LOCK_INTERRUPTED_ERROR, "key: " + key);
    }
}
