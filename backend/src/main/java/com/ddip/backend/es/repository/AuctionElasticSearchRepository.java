package com.ddip.backend.es.repository;

import com.ddip.backend.es.document.AuctionDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuctionElasticSearchRepository extends ElasticsearchRepository<AuctionDocument, Long> {
    List<AuctionDocument> findByTitle(String title);
}
