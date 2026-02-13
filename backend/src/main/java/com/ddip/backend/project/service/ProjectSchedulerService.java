package com.ddip.backend.project.service;

import com.ddip.backend.pledge.service.PledgeService;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectSchedulerService {

    private final ProjectRepository projectRepository;
    private final PledgeService pledgeService;
    private final ApplicationEventPublisher publisher;

    @Scheduled(cron = "59 59 23 * * *")
    public void closeExpireProjects() {
        LocalDate today = LocalDate.now();
        List<Project> expired = projectRepository.findByStatusAndEndAtLessThanEqual(ProjectStatus.OPEN, today);

        for (Project project : expired) {
            boolean success = project.closeProject();
            if (!success) {
                pledgeService.refundAllPaidPledges(project);
            }
            publisher.publishEvent(new ProjectEsEvent(project.getId()));
        }
    }

}
