package com.ddip.backend.auction.validation.auction;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class AuctionDeniedException extends BusinessException {
    public AuctionDeniedException(Long auctionId, Long userId) {
        super(ErrorCode.UNAUTHORIZED, "해당 경매의 접급 권한이 없습니다. auctionId: " + auctionId + ", userId: " + userId);
    }
}
