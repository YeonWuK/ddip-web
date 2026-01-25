package com.ddip.backend.handler;

import com.ddip.backend.dto.auction.AuctionEndedEventDto;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.es.document.AuctionDocument;
import com.ddip.backend.es.repository.AuctionElasticSearchRepository;
import com.ddip.backend.event.AuctionEndEvent;
import com.ddip.backend.event.AuctionEsEvent;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class AfterCommitEventHandler {

    private final AuctionRepository auctionRepository;
    private final AuctionElasticSearchRepository auctionElasticSearchRepository;

    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void auctionDocumentHandler(AuctionEsEvent event) {
        Auction auction = auctionRepository.findById(event.auctionId())
                .orElseThrow(() -> new AuctionNotFoundException(event.auctionId()));

        AuctionDocument auctionDocument = AuctionDocument.from(auction, auction.getMainImagKey());

        log.info("auction: {}, Es Document Title: {}", auction.getTitle(), auctionDocument.getTitle());

        auctionElasticSearchRepository.save(auctionDocument);
    }

    @Transactional(readOnly = true)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void auctionEventHandler(AuctionEndEvent event) {
        Auction auction = auctionRepository.findById(event.auctionId())
                .orElseThrow(() -> new AuctionNotFoundException(event.auctionId()));

        AuctionEndedEventDto auctionEndedEventDto = AuctionEndedEventDto.from(auction);

        messagingTemplate.convertAndSend("/topic/auction/" + auction.getId(), auctionEndedEventDto);
    }
}
