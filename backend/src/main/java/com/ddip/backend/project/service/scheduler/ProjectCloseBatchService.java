package com.ddip.backend.project.service.scheduler;

import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.event.ProjectClosedEvent;
import com.ddip.backend.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectCloseBatchService {

    private final ProjectRepository projectRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public int closeExpiredBatch(LocalDate today, int batchSize) {
        List<Project> projects = projectRepository.findExpiredOpenProjectsForUpdate(today, batchSize);
        if (projects.isEmpty()) return 0;

        for (Project project : projects) {
            boolean success = project.closeProject();
            eventPublisher.publishEvent(new ProjectClosedEvent(project.getId(), success));
        }
        return projects.size();
    }

}
