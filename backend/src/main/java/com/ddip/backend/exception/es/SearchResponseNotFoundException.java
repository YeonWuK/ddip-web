package com.ddip.backend.exception.es;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class SearchResponseNotFoundException extends BusinessException {
    public SearchResponseNotFoundException(String detail) {
        super(ErrorCode.SEARCH_RESPONSE_NOT_FOUND, detail);
    }
}
