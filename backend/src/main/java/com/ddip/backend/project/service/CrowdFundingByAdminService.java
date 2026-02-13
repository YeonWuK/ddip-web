package com.ddip.backend.project.service;

import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.pledge.service.PledgeService;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.project.validation.project.ProjectNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CrowdFundingByAdminService {

    private final ProjectRepository projectRepository;
    private final PledgeService pledgeService;
    private final ApplicationEventPublisher publisher;

    @Transactional(readOnly = true)
    public Page<AdminProjectSummaryDto> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        Page<Project> projects = projectRepository.searchProjectsForAdmin(condition, pageable);
        return projects.map(AdminProjectSummaryDto::from);
    }

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
        Project project = getProject(projectId);
        project.cancel();
        pledgeService.refundAllPaidPledges(project);
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    private Project getProject(Long projectId) {
        return projectRepository.findByIdForUpdate(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }
}
