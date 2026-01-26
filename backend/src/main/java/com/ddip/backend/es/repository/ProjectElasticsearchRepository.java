package com.ddip.backend.es.repository;

import com.ddip.backend.es.document.ProjectDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectElasticsearchRepository extends ElasticsearchRepository<ProjectDocument, Long> {
}