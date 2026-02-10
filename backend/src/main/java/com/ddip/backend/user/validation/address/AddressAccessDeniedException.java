package com.ddip.backend.user.validation.address;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class AddressAccessDeniedException extends BusinessException {

    public AddressAccessDeniedException(Long addressId, Long userId) {
        super(ErrorCode.FORBIDDEN, "해당 배송지에 대한 삭제 권한이 없습니다. addressId=" + addressId + ", userId=" + userId);
    }

}
