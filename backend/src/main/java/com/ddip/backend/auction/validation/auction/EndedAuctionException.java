package com.ddip.backend.auction.validation.auction;

import com.ddip.backend.auction.dto.enums.AuctionStatus;
import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class EndedAuctionException extends BusinessException {
    public EndedAuctionException(AuctionStatus status) {
        super(ErrorCode.AUCTION_ENDED, "해당 경매는 종료 되었습니다. status: " + status);
    }
}
