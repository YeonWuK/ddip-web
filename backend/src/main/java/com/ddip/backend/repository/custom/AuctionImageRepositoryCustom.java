package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.AuctionImage;

import java.util.List;

public interface AuctionImageRepositoryCustom {
    List<AuctionImage> findImagesByAuctionId(Long auctionId);
}
