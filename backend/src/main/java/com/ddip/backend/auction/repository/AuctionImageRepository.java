package com.ddip.backend.auction.repository;

import com.ddip.backend.auction.domain.AuctionImage;
import com.ddip.backend.auction.repository.custom.AuctionImageRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionImageRepository extends JpaRepository<AuctionImage, Long>, AuctionImageRepositoryCustom {
}
