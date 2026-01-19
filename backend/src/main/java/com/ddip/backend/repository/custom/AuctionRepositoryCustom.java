package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Auction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuctionRepositoryCustom {

    Optional<Auction> findDetailById(Long auctionId);

    List<Auction> findAllByOrderByIdDesc();

    List<Auction> findEndAuctions(LocalDateTime now, int limit);

    List<Auction> findAuctionsByUserId(Long userId);
}