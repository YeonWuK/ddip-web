package com.ddip.backend.auction.es.util;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class AuctionQueryBuilder {

    // ES date 필드 포맷 (auction-mapping.json 포맷과 일치)
    private static final DateTimeFormatter ES_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    /**
     * 키워드 검색 쿼리
     * - 노출 상태: RUNNING(진행중) / ENDED(종료) — CANCELED만 제외
     * - 가중치: title^3 > description^1 (nori 형태소 분석)
     */
    public Query buildKeywordQuery(String keyword) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();

        applyKeyword(boolQuery, keyword);

        // CANCELED는 mustNot으로 제외, 나머지(RUNNING/ENDED)는 모두 노출
        boolQuery.mustNot(TermQuery.of(t -> t
                .field("status")
                .value(FieldValue.of("CANCELED"))
        )._toQuery());

        return boolQuery.build()._toQuery();
    }

    /**
     * 상세 필터 검색 쿼리
     * - 노출 상태: 전체 (상세 검색에서는 CANCELED 포함 모두 조회 가능)
     * - keyword null 허용: 키워드 없이 날짜 필터만으로도 검색 가능
     * - endAt 필터: 해당 날짜/시간 이전에 마감하는 경매로 범위 제한 (null이면 미적용)
     */
    public Query buildFilterQuery(String keyword, LocalDateTime endAt) {
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

        return boolQuery.build()._toQuery();
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
}
