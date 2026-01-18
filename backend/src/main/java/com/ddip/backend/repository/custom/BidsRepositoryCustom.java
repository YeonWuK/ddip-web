package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Bids;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidsRepositoryCustom {

    List<Bids> findBidsByUserId(Long userId);

    Optional<Bids> findTopBidByAuctionId(Long auctionId);
}
