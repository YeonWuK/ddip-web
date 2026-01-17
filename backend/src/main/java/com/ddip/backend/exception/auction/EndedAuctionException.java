package com.ddip.backend.exception.auction;

import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class EndedAuctionException extends BusinessException {
    public EndedAuctionException(AuctionStatus status) {
        super(ErrorCode.AUCTION_ENDED, "해당 경매는 종료 되었습니다. status: " + status);
    }
}
