package com.ddip.backend.es.repository;

import com.ddip.backend.es.document.AuctionDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionElasticSearchRepository extends ElasticsearchRepository<AuctionDocument, Long> {
}
