package com.ddip.backend.exception.distributedlock;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class LockInterruptedException extends BusinessException {
    public LockInterruptedException(String key) {
        super(ErrorCode.LOCK_INTERRUPTED_ERROR, "key: " + key);
    }
}
