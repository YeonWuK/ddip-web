package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Auction;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


public interface AuctionCustomRepository {

    Optional<Auction> findDetailById(Long auctionId);

    List<Auction> findAllDesc();

    List<Auction> findEndAuctions(LocalDateTime now, int limit);
}