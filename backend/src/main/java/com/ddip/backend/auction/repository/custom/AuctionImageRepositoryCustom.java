package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.domain.AuctionImage;

import java.util.List;

public interface AuctionImageRepositoryCustom {
    List<AuctionImage> findImagesByAuctionId(Long auctionId);
}
