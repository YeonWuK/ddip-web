package com.ddip.backend.project.service.scheduler;

import com.ddip.backend.pledge.service.PledgeService;
import com.ddip.backend.project.event.ProjectClosedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ProjectClosedEventHandler {

    private final PledgeService pledgeService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ProjectClosedEvent event) {
        if (!event.success()) {
            pledgeService.refundAllPaidPledgesByProjectId(event.projectId());
        }
    }

}