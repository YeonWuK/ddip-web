package com.ddip.backend.exception.auction;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class AuctionDeniedException extends BusinessException {
    public AuctionDeniedException(Long auctionId, Long userId) {
        super(ErrorCode.UNAUTHORIZED, "해당 경매의 접급 권한이 없습니다. auctionId: " + auctionId + ", userId: " + userId);
    }
}
