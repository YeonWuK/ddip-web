package com.ddip.backend.project.es.util;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;

@Component
public class ProjectQueryBuilder {

    // 키워드 검색에서 노출할 상태값 (DRAFT/REJECTED/CANCELED/STOP 제외)
    private static final List<FieldValue> PUBLIC_STATUSES = List.of(
            FieldValue.of("OPEN"),
            FieldValue.of("SUCCESS"),
            FieldValue.of("FAILED")
    );

    /**
     * 키워드 검색 쿼리
     * - 노출 상태: OPEN(진행중) / SUCCESS(성공) / FAILED(종료) — DRAFT/REJECTED/CANCELED/STOP 제외
     * - 가중치: title^3 > tags^2 > summary^1 (nori 형태소 / tag_analyzer)
     * - 인기도 반영: likeCount를 log1p 감쇠 후 relevance 점수에 합산
     */
    public Query buildKeywordQuery(String keyword) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        applyKeyword(boolQuery, keyword);
        boolQuery.filter(TermsQuery.of(t -> t
                .field("status")
                .terms(TermsQueryField.of(f -> f.value(PUBLIC_STATUSES)))
        )._toQuery());
        return wrapWithLikeCount(boolQuery.build()._toQuery());
    }

    /**
     * 상세 필터 검색 쿼리
     * - 노출 상태: 전체 (종료/실패 포함, 상세 검색에서는 모두 조회 가능)
     * - keyword null 허용: 키워드 없이 날짜 필터만으로도 검색 가능
     * - endAt 필터: 해당 날짜 이전에 마감하는 프로젝트로 범위 제한 (null이면 미적용)
     * - 인기도 반영: likeCount를 log1p 감쇠 후 relevance 점수에 합산
     */
    public Query buildFilterQuery(String keyword, LocalDate endAt) {
        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        applyKeyword(boolQuery, keyword);
        if (endAt != null) {
            boolQuery.filter(Query.of(q -> q
                    .range(r -> r
                            .date(d -> d
                                    .field("endAt")
                                    .lte(endAt.toString())))
            ));
        }
        return wrapWithLikeCount(boolQuery.build()._toQuery());
    }

    /**
     * 키워드가 있으면 multi_match (most_fields), 없으면 match_all 적용
     * most_fields: 여러 필드의 점수를 합산 → 여러 필드에서 동시에 매칭될수록 높은 점수
     */
    private void applyKeyword(BoolQuery.Builder boolQuery, String keyword) {
        if (StringUtils.hasText(keyword)) {
            boolQuery.must(MultiMatchQuery.of(m -> m
                    .query(keyword.trim())
                    .fields(List.of("title^3", "tags^2", "summary^1"))
                    .type(TextQueryType.MostFields)
            )._toQuery());
        } else {
            boolQuery.must(MatchAllQuery.of(m -> m)._toQuery());
        }
    }

    /**
     * function_score로 likeCount 인기도를 relevance 점수에 합산
     * - factor 0.5: likeCount 원값을 절반으로 스케일 다운
     * - log1p: log(1 + likeCount * factor) 적용 → 인기도 급격한 편향 방지, 0이어도 에러 없음
     * - boost_mode SUM: 기존 relevance 점수 + 인기도 점수 합산 (MULTIPLY면 관련성 낮은 인기글이 상위 점령)
     */
    private Query wrapWithLikeCount(Query query) {
        return FunctionScoreQuery.of(f -> f
                .query(query)
                .functions(fn -> fn
                        .fieldValueFactor(fvf -> fvf
                                .field("likeCount")
                                .factor(0.5)
                                .modifier(FieldValueFactorModifier.Log1p)
                                .missing(1.0)
                        )
                )
                .boostMode(FunctionBoostMode.Sum)
        )._toQuery();
    }
}
