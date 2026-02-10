package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.domain.Bids;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidsRepositoryCustom {

    List<Bids> findBidsByAuctionId(Long auctionId);

    List<Bids> findBidsByUserId(Long userId);
}
