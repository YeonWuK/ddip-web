package com.ddip.backend.auction.es.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.auction.dto.es.AuctionSearchCondition;
import com.ddip.backend.auction.dto.es.AuctionSearchResponse;
import com.ddip.backend.auction.dto.es.AuctionSearchSliceResponse;
import com.ddip.backend.auction.es.document.AuctionDocument;
import com.ddip.backend.auction.es.util.AuctionQueryBuilder;
import com.ddip.backend.common.exception.es.SearchResponseNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final AuctionQueryBuilder auctionQueryBuilder;

    /**
     * 키워드 검색 (search_after 커서 기반 페이지네이션)
     *
     */
    public AuctionSearchSliceResponse searchAuctionsByKeyword(AuctionSearchCondition condition) {
        try {
            SearchRequest searchRequest = auctionQueryBuilder.buildKeywordSearchRequest(
                    condition.getTitle(),
                    condition.getSize(),
                    condition.getSearchAfterScore(),
                    condition.getSearchAfterId()
            );
            return executeSearchAfter(searchRequest, condition.getSize());
        } catch (Exception e) {
            log.error("경매 키워드 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }

    /**
     * 필터 검색 (search_after 커서 기반 페이지네이션)
     *
     */
    public AuctionSearchSliceResponse searchAuctionByFilter(AuctionSearchCondition condition) {
        try {
            SearchRequest searchRequest =
                    auctionQueryBuilder.buildFilterSearchRequest(
                            condition.getTitle(),
                            condition.getEndAt(),
                            condition.getSize(),
                            condition.getSearchAfterScore(),
                            condition.getSearchAfterId()
                    );
            return executeSearchAfter(searchRequest, condition.getSize());
        } catch (Exception e) {
            log.error("경매 필터 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }

    /**
     * search_after 공통 실행 메서드
     *
     * size+1 건을 조회해서 hasNext를 판단한다.
     * 정렬 기준: _score desc → id desc (tiebreaker, 페이지 안정성 보장)
     */
    private AuctionSearchSliceResponse executeSearchAfter(SearchRequest searchRequest, int size) throws Exception {
        SearchResponse<AuctionDocument> searchResponse =
                elasticsearchClient.search(searchRequest, AuctionDocument.class);

        List<Hit<AuctionDocument>> hits = searchResponse.hits().hits();
        boolean hasNext = hits.size() > size;
        List<Hit<AuctionDocument>> pageHits = hasNext ? hits.subList(0, size) : hits;

        List<AuctionSearchResponse> content = pageHits.stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(AuctionSearchResponse::from)
                .toList();

        Double nextScore = null;
        Long nextId = null;

        if (hasNext && !pageHits.isEmpty()) {
            List<FieldValue> sortValues = pageHits.get(pageHits.size() - 1).sort();
            if (sortValues != null && sortValues.size() == 2) {
                nextScore = sortValues.get(0).doubleValue();
                nextId = sortValues.get(1).longValue();
            }
        }

        return AuctionSearchSliceResponse.builder()
                .content(content)
                .hasNext(hasNext)
                .nextSearchAfterScore(nextScore)
                .nextSearchAfterId(nextId)
                .build();
    }
}
