package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.admin.auction.AdminAuctionSearchCondition;
import com.ddip.backend.entity.Auction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuctionRepositoryCustom {

    Optional<Auction> findDetailById(Long auctionId);

    List<Auction> findAllByOrderByIdDesc();

    List<Auction> findEndAuctions(LocalDateTime now, int limit);

    List<Auction> findAuctionsByUserId(Long userId);

    Page<Auction> searchAuctionsForAdmin(AdminAuctionSearchCondition condition, Pageable pageable);

}