package com.ddip.backend.es.util;

import co.elastic.clients.elasticsearch._types.query_dsl.*;
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
            boolQuery.filter(q -> q.range(r -> r
                    .date(d -> d
                            .field("endAt")
                            .lte(ES_DATE_FORMATTER.format(endAt))
                    )
            ));
        }

        return boolQuery.build()._toQuery();
    }
}
