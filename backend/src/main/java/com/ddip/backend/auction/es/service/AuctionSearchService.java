package com.ddip.backend.auction.es.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.auction.dto.es.AuctionSearchResponse;
import com.ddip.backend.auction.es.document.AuctionDocument;
import com.ddip.backend.auction.es.util.AuctionQueryBuilder;
import com.ddip.backend.common.exception.es.SearchResponseNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final AuctionQueryBuilder auctionQueryBuilder;

    public List<AuctionSearchResponse> searchAuctionsByKeyword(String title) {
        try {
            SearchRequest searchRequest = new SearchRequest.Builder()
                    .index("auction")
                    .query(auctionQueryBuilder.buildKeywordQuery(title))
                    .size(20)
                    .build();

            SearchResponse<AuctionDocument> searchResponse =
                    elasticsearchClient.search(searchRequest, AuctionDocument.class);

            return searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(AuctionSearchResponse::from)
                    .toList();

        } catch (Exception e) {
            log.error("경매 키워드 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }

    public Page<AuctionSearchResponse> searchAuctionByFilter(String title, LocalDateTime endAt,
                                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        try {
            Query query = auctionQueryBuilder.buildFilterQuery(title, endAt);

            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index("auction")
                    .query(query)
                    .from(page * size)
                    .size(size)
            );

            SearchResponse<AuctionDocument> searchResponse =
                    elasticsearchClient.search(searchRequest, AuctionDocument.class);

            List<AuctionSearchResponse> auctions = searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .map(AuctionSearchResponse::from)
                    .toList();

            long total = searchResponse.hits().total() == null ? auctions.size() :
                    searchResponse.hits().total().value();

            return new PageImpl<>(auctions, pageable, total);

        } catch (Exception e) {
            log.error("경매 필터 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }
}
