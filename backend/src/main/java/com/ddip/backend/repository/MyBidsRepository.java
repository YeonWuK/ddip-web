package com.ddip.backend.repository;

import com.ddip.backend.entity.MyBids;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MyBidsRepository extends JpaRepository<MyBids, Long> {
    Optional<MyBids> findByUserIdAndAuctionId(Long userId, Long auctionId);
}
