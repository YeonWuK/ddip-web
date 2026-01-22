package com.ddip.backend.repository;

import com.ddip.backend.entity.AuctionImage;
import com.ddip.backend.repository.custom.AuctionImageRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionImageRepository extends JpaRepository<AuctionImage, Long>, AuctionImageRepositoryCustom {
}
