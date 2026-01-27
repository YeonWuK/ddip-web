package com.ddip.backend.handler;

import com.ddip.backend.dto.auction.AuctionEndedEventDto;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.Project;
import com.ddip.backend.es.document.AuctionDocument;
import com.ddip.backend.es.document.ProjectDocument;
import com.ddip.backend.es.repository.AuctionElasticsearchRepository;
import com.ddip.backend.es.repository.ProjectElasticsearchRepository;
import com.ddip.backend.event.AuctionEndEvent;
import com.ddip.backend.event.AuctionEsEvent;
import com.ddip.backend.event.ProjectEsEvent;
import com.ddip.backend.exception.auction.AuctionNotFoundException;
import com.ddip.backend.repository.AuctionRepository;
import com.ddip.backend.repository.ProjectRepository;
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

    private final ProjectRepository projectRepository;
    private final AuctionRepository auctionRepository;
    private final ProjectElasticsearchRepository projectElasticsearchRepository;
    private final AuctionElasticsearchRepository auctionElasticSearchRepository;

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
    public void projectDocumentHandler(ProjectEsEvent event) {
        Project project = projectRepository.findById(event.projectId())
                .orElseThrow(() -> new AuctionNotFoundException(event.projectId()));

        ProjectDocument projectDocument = ProjectDocument.from(project, project.getThumbnailUrl());

        log.info("project: {}, Es Document Title: {}", project.getTitle(), projectDocument.getTitle());

        projectElasticsearchRepository.save(projectDocument);
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
