package com.ddip.backend.controller;

import com.ddip.backend.dto.es.AuctionSearchResponse;
import com.ddip.backend.dto.es.SearchAutoCompleteResponse;
import com.ddip.backend.es.service.AuctionSearchService;
import com.ddip.backend.es.service.SearchAddOnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class SearchController {

    private final AuctionSearchService auctionSearchService;
    private final SearchAddOnService findAutoCompleteSuggestionService;

    /**
     * 검색 자동완성
     */
    @GetMapping("/suggest")
    public ResponseEntity<List<SearchAutoCompleteResponse>> autoComplete(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(findAutoCompleteSuggestionService.searchAutoComplete(keyword));
    }

    /**
     * 경매 검색
     */
    @GetMapping("/auction")
    public ResponseEntity<List<AuctionSearchResponse>> auctionSearch(@RequestParam("title") String title) {
        List<AuctionSearchResponse> auctions = auctionSearchService.searchAuctionsByKeyword(title);

        return ResponseEntity.ok(auctions);
    }

    /**
     * 경매 상세 검색
     */
    @GetMapping("/auction/filter")
    public ResponseEntity<Page<AuctionSearchResponse>> auctionSearchFilter(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endAt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

       Page<AuctionSearchResponse> auctions = auctionSearchService.searchAuctionByFilter(title, endAt, page, size);

        return ResponseEntity.ok(auctions);
    }
}
