package com.ddip.backend.project.service;

import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.project.validation.project.ProjectNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AdminProjectQueryService {

    private final ProjectRepository projectRepository;

    public Project getProjectWithRewardTiersAndCreator(Long projectId) {
        return projectRepository.findByIdWithRewardTiersAndCreator(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    public List<Project> findByCreatorId(Long creatorId) {
        List<Project> byCreatorId = projectRepository.findByCreatorId(creatorId);
        if (byCreatorId.isEmpty()) {
            log.warn("No project found with creator id {}", creatorId);
            throw new ProjectNotFoundException(creatorId);
        }
        return byCreatorId;
    }

}