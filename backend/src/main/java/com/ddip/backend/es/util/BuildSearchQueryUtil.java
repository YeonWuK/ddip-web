package com.ddip.backend.es.util;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.MatchQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import co.elastic.clients.json.JsonData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class BuildSearchQueryUtil {

    private static final DateTimeFormatter ES_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    /**
     * 상세 검색 쿼리
     */
    public Query buildSearchQuery(String title, LocalDateTime endAt) {

        BoolQuery.Builder boolQuery = new BoolQuery.Builder();

        if (title != null) {
            boolQuery.must(MatchQuery.of(m -> m.query("title.ngram").query(title))._toQuery());
        }

        if (endAt != null) {
            // And (조건 <= endAt)
            boolQuery.must(QueryBuilders.range().field("endAt")
                    .lte(JsonData.of(ES_DATE_FORMATTER.format(endAt)))
                    .build()._toQuery());
        }

        return boolQuery.build()._toQuery();
    }
}
