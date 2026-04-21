package com.ddip.backend.auction.es.repository;

import com.ddip.backend.auction.es.document.AuctionDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionElasticsearchRepository extends ElasticsearchRepository<AuctionDocument, Long> {
}
