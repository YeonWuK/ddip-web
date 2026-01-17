package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Bids;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BidsRepositoryCustom {
    Optional<Bids> findTopBidByAuctionId(Long auctionId);
}
