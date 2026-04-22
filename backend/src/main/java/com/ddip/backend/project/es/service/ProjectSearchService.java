package com.ddip.backend.project.es.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.ddip.backend.common.exception.es.SearchResponseNotFoundException;
import com.ddip.backend.project.dto.es.ProjectSearchCondition;
import com.ddip.backend.project.dto.es.ProjectSearchResponse;
import com.ddip.backend.project.es.document.ProjectDocument;
import com.ddip.backend.project.es.util.ProjectQueryBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectSearchService {

    private final ElasticsearchClient elasticsearchClient;
    private final ProjectQueryBuilder projectQueryBuilder;

    public Page<ProjectSearchResponse> searchProjectByKeyword(ProjectSearchCondition condition, Pageable pageable) {
        try {
            SearchRequest searchRequest = new SearchRequest.Builder()
                    .index("project")
                    .query(projectQueryBuilder.buildKeywordQuery(condition.getTitle()))
                    .from((int) pageable.getOffset())
                    .size(pageable.getPageSize())
                    .build();

            return executeSearch(searchRequest, pageable);
        } catch (Exception e) {
            log.error("공동구매 키워드 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }

    public Page<ProjectSearchResponse> searchProjectByFilter(ProjectSearchCondition condition, Pageable pageable) {
        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                    .index("project")
                    .query(projectQueryBuilder.buildFilterQuery(condition.getTitle(), condition.getEndAt()))
                    .from((int) pageable.getOffset())
                    .size(pageable.getPageSize())
            );

            return executeSearch(searchRequest, pageable);
        } catch (Exception e) {
            log.error("공동구매 필터 검색 오류: {}", e.getMessage());
            throw new SearchResponseNotFoundException("검색 중 오류가 발생했습니다.");
        }
    }

    private Page<ProjectSearchResponse> executeSearch(SearchRequest searchRequest, Pageable pageable) throws Exception {
        SearchResponse<ProjectDocument> searchResponse =
                elasticsearchClient.search(searchRequest, ProjectDocument.class);

        List<ProjectSearchResponse> projects = searchResponse.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(ProjectSearchResponse::from)
                .toList();

        long total = searchResponse.hits().total() == null
                ? projects.size()
                : searchResponse.hits().total().value();

        return new PageImpl<>(projects, pageable, total);
    }
}
