package com.ddip.backend.common.exception.es;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class SearchResponseNotFoundException extends BusinessException {
    public SearchResponseNotFoundException(String detail) {
        super(ErrorCode.SEARCH_RESPONSE_NOT_FOUND, detail);
    }
}
