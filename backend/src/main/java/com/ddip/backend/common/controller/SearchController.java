package com.ddip.backend.common.controller;

import com.ddip.backend.auction.dto.es.AuctionSearchResponse;
import com.ddip.backend.common.dto.es.SearchAutoCompleteResponse;
import com.ddip.backend.auction.es.service.AuctionSearchService;
import com.ddip.backend.common.es.AutoCompleteService;
import com.ddip.backend.project.es.service.ProjectSearchService;
import com.ddip.backend.project.dto.es.ProjectSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class SearchController {

    private final ProjectSearchService projectSearchService;
    private final AuctionSearchService auctionSearchService;
    private final AutoCompleteService autoCompleteService;

    @GetMapping("/suggest")
    public ResponseEntity<List<SearchAutoCompleteResponse>> autoComplete(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(autoCompleteService.searchAutoComplete(keyword));
    }

    @GetMapping("/auction")
    public ResponseEntity<List<AuctionSearchResponse>> auctionSearch(@RequestParam("title") String title) {
        return ResponseEntity.ok(auctionSearchService.searchAuctionsByKeyword(title));
    }

    @GetMapping("/auction/filter")
    public ResponseEntity<Page<AuctionSearchResponse>> auctionSearchFilter(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endAt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(auctionSearchService.searchAuctionByFilter(title, endAt, page, size));
    }

    @GetMapping("/project")
    public ResponseEntity<List<ProjectSearchResponse>> projectSearch(@RequestParam("title") String title) {
        return ResponseEntity.ok(projectSearchService.searchProjectByKeyword(title));
    }

    @GetMapping("/project/filter")
    public ResponseEntity<Page<ProjectSearchResponse>> projectSearchFilter(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate endAt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(projectSearchService.searchProjectByFilter(title, endAt, page, size));
    }
}
