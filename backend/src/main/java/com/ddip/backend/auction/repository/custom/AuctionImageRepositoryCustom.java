package com.ddip.backend.auction.repository.custom;

import com.ddip.backend.auction.domain.AuctionImage;
import com.ddip.backend.project.domain.ProjectImage;

import java.util.List;
import java.util.Optional;

public interface AuctionImageRepositoryCustom {
    List<AuctionImage> findImagesByAuctionId(Long auctionId);

    List<AuctionImage> findImageIdsByAuctionIdAndIds(Long auctionId, List<Long> imageIds);

    Optional<AuctionImage> findMainByAuctionId(Long auctionId);

    void clearMainByAuctionId(Long auctionId);

    void setMainById(Long imageId);

}
