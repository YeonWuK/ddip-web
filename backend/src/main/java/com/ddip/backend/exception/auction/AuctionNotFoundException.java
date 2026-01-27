package com.ddip.backend.exception.auction;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class AuctionNotFoundException extends BusinessException {
    public AuctionNotFoundException(Long auctionId) {
        super(ErrorCode.AUCTION_NOT_FOUND, "존재하지 않는 경매입니다 auctionId: " + auctionId);
    }
}
