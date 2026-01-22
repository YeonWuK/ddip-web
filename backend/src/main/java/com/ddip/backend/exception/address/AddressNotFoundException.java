package com.ddip.backend.exception.address;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class AddressNotFoundException extends BusinessException {

    public AddressNotFoundException(long addressId) {
        super(ErrorCode.ADDRESS_NOT_FOUND, "해당 주소를 찾을 수 없습니다." + addressId );
    }

}
