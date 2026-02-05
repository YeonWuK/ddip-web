package com.ddip.backend.exception.es;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class SearchResponseNotFoundException extends BusinessException {
    public SearchResponseNotFoundException(String detail) {
        super(ErrorCode.SEARCH_RESPONSE_NOT_FOUND, detail);
    }
}
