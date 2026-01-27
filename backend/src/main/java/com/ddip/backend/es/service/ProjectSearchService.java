package com.ddip.backend.es.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.dto.es.ProjectSearchResponse;
import com.ddip.backend.es.util.BuildSearchQueryUtil;
import com.ddip.backend.exception.es.SearchResponseNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final BuildSearchQueryUtil buildSearchQueryUtil;

    /**
     * 일반 검색
     */
    public List<ProjectSearchResponse> searchProjectByKeyword(String title) {
        try{
            SearchRequest searchRequest = new SearchRequest.Builder()
                    .index("project")
                    .query(q -> q
                            .matchPhrase(m -> m
                                    .query(title)
                                    .field("title")
                            )
                    )
                    .size(20)
                    .build();

            SearchResponse<ProjectSearchResponse> searchResponse =
                    elasticsearchClient.search(searchRequest, ProjectSearchResponse.class);

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
    public Page<ProjectSearchResponse> searchProjectByFilter(String title, LocalDate endAt,
                                                             int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        try {
            Query query = buildSearchQueryUtil.buildProjectSearchQuery(title, endAt);

            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index("project")
                    .query(query)
                    .from(page * size)
                    .size(size)
            );

            SearchResponse<ProjectSearchResponse> searchResponse =
                    elasticsearchClient.search(searchRequest, ProjectSearchResponse.class);

            List<ProjectSearchResponse> project = searchResponse.hits().hits().stream()
                    .map(Hit::source)
                    .toList();

            long total = searchResponse.hits().total() == null ? project.size() :
                    searchResponse.hits().total().value();

            return new PageImpl<>(project, pageable, total);

        } catch (IOException e) {
            throw new SearchResponseNotFoundException("Elasticsearch 통신 오류");
        }
    }
}
