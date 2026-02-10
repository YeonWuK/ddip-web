package com.ddip.backend.auction.repository;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.repository.custom.AuctionRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long>, AuctionRepositoryCustom {
}
