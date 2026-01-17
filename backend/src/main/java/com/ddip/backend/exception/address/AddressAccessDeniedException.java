package com.ddip.backend.exception.address;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class AddressAccessDeniedException extends BusinessException {

    public AddressAccessDeniedException(Long addressId, Long userId) {
        super(ErrorCode.FORBIDDEN, "해당 배송지에 대한 삭제 권한이 없습니다. addressId=" + addressId + ", userId=" + userId);
    }

}
