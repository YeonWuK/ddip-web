package com.ddip.backend.common.controller;

import com.ddip.backend.auction.dto.es.AuctionSearchCondition;
import com.ddip.backend.auction.dto.es.AuctionSearchSliceResponse;
import com.ddip.backend.auction.es.service.AuctionSearchService;
import com.ddip.backend.common.dto.es.SearchAutoCompleteResponse;
import com.ddip.backend.common.es.AutoCompleteService;
import com.ddip.backend.project.dto.es.ProjectSearchCondition;
import com.ddip.backend.project.dto.es.ProjectSearchResponse;
import com.ddip.backend.project.es.service.ProjectSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<AuctionSearchSliceResponse> auctionSearch(@ModelAttribute AuctionSearchCondition condition) {
        return ResponseEntity.ok(auctionSearchService.searchAuctionsByKeyword(condition));
    }

    @GetMapping("/auction/filter")
    public ResponseEntity<AuctionSearchSliceResponse> auctionSearchFilter(@ModelAttribute AuctionSearchCondition condition) {
        return ResponseEntity.ok(auctionSearchService.searchAuctionByFilter(condition));
    }

    @GetMapping("/project")
    public ResponseEntity<Page<ProjectSearchResponse>> projectSearch(
            @ModelAttribute ProjectSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(projectSearchService.searchProjectByKeyword(condition, pageable));
    }

    @GetMapping("/project/filter")
    public ResponseEntity<Page<ProjectSearchResponse>> projectSearchFilter(
            @ModelAttribute ProjectSearchCondition condition,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(projectSearchService.searchProjectByFilter(condition, pageable));
    }
}
