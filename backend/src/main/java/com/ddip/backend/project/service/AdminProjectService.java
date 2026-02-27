package com.ddip.backend.project.service;

import com.ddip.backend.pledge.service.PledgeService;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.exception.project.ProjectNotFoundException;
import com.ddip.backend.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminProjectService {

    private final ProjectRepository projectRepository;
    private final PledgeService pledgeService;
    private final ApplicationEventPublisher publisher;

    public void approveProjectByAdmin(Long projectId) {
        Project project = getProject(projectId);
        project.openFunding();
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    public void rejectProjectByAdmin(Long projectId) {
        Project project = getProject(projectId);
        project.rejectByAdmin();
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    public void forceStopByAdmin(Long projectId) {
        Project project = getProject(projectId);
        project.stopProject();
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    public void forceCancelProjectByAdmin(Long projectId) {
        Project project = getProjectForUpdate(projectId);
        project.cancel();
        pledgeService.refundAllPaidPledges(project);
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    private Project getProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    private Project getProjectForUpdate(Long projectId) {
        return projectRepository.findByIdForUpdate(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }
}
