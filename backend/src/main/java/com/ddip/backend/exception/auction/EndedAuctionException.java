package com.ddip.backend.exception.auction;

import com.ddip.backend.dto.enums.AuctionStatus;
import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class EndedAuctionException extends BusinessException {
    public EndedAuctionException(AuctionStatus status) {
        super(ErrorCode.AUCTION_ENDED, "해당 경매는 종료 되었습니다. status: " + status);
    }
}
