package com.ddip.backend.controller;

import com.ddip.backend.dto.es.AuctionSearchResponse;
import com.ddip.backend.es.service.AuctionSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class SearchController {

    private final AuctionSearchService auctionSearchService;

    @GetMapping("/auction")
    public ResponseEntity<List<AuctionSearchResponse>> auctionSearch(@RequestParam("title") String title) {
        List<AuctionSearchResponse> auctions = auctionSearchService.searchAuctionsByKeyword(title);

        return ResponseEntity.ok(auctions);
    }
}