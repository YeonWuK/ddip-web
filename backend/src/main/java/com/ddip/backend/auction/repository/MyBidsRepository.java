package com.ddip.backend.auction.repository;

import com.ddip.backend.auction.domain.MyBids;
import com.ddip.backend.auction.repository.custom.MyBidsRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MyBidsRepository extends JpaRepository<MyBids, Long> , MyBidsRepositoryCustom {
    Optional<MyBids> findByUserIdAndAuctionId(Long userId, Long auctionId);
}
