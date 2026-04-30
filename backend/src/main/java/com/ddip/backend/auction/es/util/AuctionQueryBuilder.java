package com.ddip.backend.auction.es.util;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class AuctionQueryBuilder {

    private static final DateTimeFormatter ES_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    /**
     * 키워드 검색 쿼리
     * - 노출 상태: RUNNING / ENDED — CANCELED 제외
     * - 가중치: title^3 > description^1 (nori 형태소 분석)
     */
    public SearchRequest buildKeywordSearchRequest(String keyword, int size, Double searchAfterScore, Long searchAfterId) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        applyKeyword(boolQuery, keyword);
        boolQuery.mustNot(TermQuery.of(t -> t
                .field("status")
                .value(FieldValue.of("CANCELED"))
        )._toQuery());
        return buildSearchAfterRequest(boolQuery.build()._toQuery(), size, searchAfterScore, searchAfterId);
    }

    /**
     * 상세 필터 검색 쿼리
     * - 노출 상태: 전체 (CANCELED 포함)
     * - keyword null 허용: 키워드 없이 날짜 필터만으로도 검색 가능
     * - endAt 필터: 해당 날짜/시간 이전에 마감하는 경매로 범위 제한 (null이면 미적용)
     */
    public SearchRequest buildFilterSearchRequest(String keyword, LocalDateTime endAt,
                                                  int size, Double searchAfterScore, Long searchAfterId) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        applyKeyword(boolQuery, keyword);
        if (endAt != null) {
            boolQuery.filter(Query.of(q -> q
                    .range(r -> r
                            .date(d -> d
                                    .field("endAt")
                                    .lte(ES_DATE_FORMATTER.format(endAt))))
            ));
        }
        return buildSearchAfterRequest(boolQuery.build()._toQuery(), size, searchAfterScore, searchAfterId);
    }

    /**
     * 키워드가 있으면 multi_match (most_fields), 없으면 match_all 적용
     * most_fields: 여러 필드의 점수를 합산 → 여러 필드에서 동시에 매칭될수록 높은 점수
     */
    private void applyKeyword(BoolQuery.Builder boolQuery, String keyword) {
        if (StringUtils.hasText(keyword)) {
            boolQuery.must(MultiMatchQuery.of(m -> m
                    .query(keyword.trim())
                    .fields(List.of("title^3", "description^1"))
                    .type(TextQueryType.MostFields)
            )._toQuery());
        } else {
            boolQuery.must(MatchAllQuery.of(m -> m)._toQuery());
        }
    }

    private SearchRequest buildSearchAfterRequest(Query query, int size, Double searchAfterScore, Long searchAfterId) {
        SearchRequest.Builder requestBuilder = new SearchRequest.Builder()
                .index("auction")
                .query(query)
                .sort(s -> s.score(sc -> sc.order(SortOrder.Desc)))
                .sort(s -> s.field(f -> f.field("id").order(SortOrder.Desc)))
                .size(size + 1);

        if (searchAfterScore != null && searchAfterId != null) {
            requestBuilder.searchAfter(List.of(
                    FieldValue.of(searchAfterScore),
                    FieldValue.of(searchAfterId)
            ));
        }

        return requestBuilder.build();
    }
}
