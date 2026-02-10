package com.ddip.backend.auction.validation.auction;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class AuctionNotFoundException extends BusinessException {
    public AuctionNotFoundException(Long auctionId) {
        super(ErrorCode.AUCTION_NOT_FOUND, "존재하지 않는 경매입니다 auctionId: " + auctionId);
    }
}
