package com.ddip.backend.project.es.repository;

import com.ddip.backend.project.es.document.ProjectDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectElasticsearchRepository extends ElasticsearchRepository<ProjectDocument, Long> {
}