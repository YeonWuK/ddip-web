package com.ddip.backend.repository;

import com.ddip.backend.entity.Auction;
import com.ddip.backend.repository.custom.AuctionCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long>, AuctionCustomRepository {
}
