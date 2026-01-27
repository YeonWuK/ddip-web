package com.ddip.backend.es.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.dto.es.AuctionSearchResponse;
import com.ddip.backend.es.util.BuildSearchQueryUtil;
import com.ddip.backend.exception.es.SearchResponseNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuctionSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final BuildSearchQueryUtil buildSearchQueryUtil;

    /**
     * 일반 검색
     */
    public List<AuctionSearchResponse> searchAuctionsByKeyword(String title) {

        try {
            SearchRequest searchRequest = new SearchRequest.Builder()
                    // auction 인덱스
                    .index("auction")
                    .query(q -> q
                            .multiMatch(m -> m
                                    // 제목으로 검색
                                    .query(title)
                                    // 제목과 관련된 내용도 같이 검색(제목이 우선)
                                    .fields("title^2", "description")
                            )
                    )
                    .size(20)
                    .build();

            SearchResponse<AuctionSearchResponse> searchResponse =
                    elasticsearchClient.search(searchRequest, AuctionSearchResponse.class);

            return searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .toList();
        } catch (IOException e) {
            throw new SearchResponseNotFoundException(e.getMessage());
        }
    }

    /**
     * 상세 검색
     */
    public Page<AuctionSearchResponse> searchAuctionByFilter(String title, LocalDateTime endAt,
                                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        try {
            Query query = buildSearchQueryUtil.buildAuciotnSearchQuery(title, endAt);

            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index("auction")
                    .query(query)
                    .from(page * size)
                    .size(size)
            );

            SearchResponse<AuctionSearchResponse> searchResponse =
                    elasticsearchClient.search(searchRequest, AuctionSearchResponse.class);

            List<AuctionSearchResponse> auctions = searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .toList();

            long total = searchResponse.hits().total() == null ? auctions.size() :
                    searchResponse.hits().total().value();

            return new PageImpl<>(auctions, pageable, total);

        } catch (IOException e) {
            throw new SearchResponseNotFoundException("Elasticsearch 통신 오류");
        }
    }
}