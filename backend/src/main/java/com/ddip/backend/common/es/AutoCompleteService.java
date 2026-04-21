package com.ddip.backend.common.es;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.common.dto.es.SearchAutoCompleteResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutoCompleteService {

    private final ElasticsearchClient elasticsearchClient;

    public List<SearchAutoCompleteResponse> searchAutoComplete(String keyword) {
        try {
            SearchRequest searchRequest = new SearchRequest.Builder()
                    .index("*")
                    .query(q -> q
                            .matchPhrase(m -> m
                                    .query(keyword)
                                    .field("title.autocomplete")
                            )
                    )
                    .size(5)
                    .build();

            SearchResponse<SearchAutoCompleteResponse> searchResponse =
                    elasticsearchClient.search(searchRequest, SearchAutoCompleteResponse.class);

            return searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .toList();
        } catch (IOException e) {
            log.error("자동완성 검색 오류: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
