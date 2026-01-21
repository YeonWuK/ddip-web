package com.ddip.backend.es.service;

import com.ddip.backend.dto.es.AuctionSearchResponse;
import com.ddip.backend.es.repository.AuctionElasticSearchRepository;
import com.ddip.backend.exception.es.SearchResponseNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class AuctionSearchService {

    private final AuctionElasticSearchRepository  auctionElasticSearchRepository;

    public List<AuctionSearchResponse> searchAuctionsByKeyword(String title) {

        List<AuctionSearchResponse> results = auctionElasticSearchRepository.findByTitle(title).stream()
                .map(AuctionSearchResponse::from)
                .collect(Collectors.toList());

        if (results.isEmpty()) {
            throw new SearchResponseNotFoundException("검색 결과가 존재하지 않습니다.");
        }
        return results;
    }
}
