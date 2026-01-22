package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Bids;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidsRepositoryCustom {
    List<Bids> findBidsByUserId(Long userId);
}
