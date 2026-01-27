package com.ddip.backend.repository;

import com.ddip.backend.entity.Bids;
import com.ddip.backend.repository.custom.BidsRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidsRepository extends JpaRepository<Bids, Long>, BidsRepositoryCustom {
    List<Bids> findAllByUserId(Long userId);
    List<Bids> findByAuctionIdOrderByCreateTimeAsc(Long auctionId);
}
