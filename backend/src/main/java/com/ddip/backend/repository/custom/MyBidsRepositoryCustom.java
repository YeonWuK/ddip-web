package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.MyBids;

import java.util.List;
import java.util.Optional;

public interface MyBidsRepositoryCustom {

    List<MyBids> findMyBidsByUserId(Long userId);

    void markWon(Long auctionId, Long winnerUserId);
    void markLostExceptWinner(Long auctionId, Long winnerUserId);
    Optional<MyBids> findLeadingByAuctionId(Long auctionId);
}
