package com.ddip.backend.project.service;

import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.project.exception.project.ProjectNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AdminProjectQueryService {

    private final ProjectRepository projectRepository;

    public Page<AdminProjectSummaryDto> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        Page<Project> projects = projectRepository.searchProjectsForAdmin(condition, pageable);
        return projects.map(AdminProjectSummaryDto::from);
    }

    public Project getProjectWithRewardTiers(Long projectId) {
        return projectRepository.findByIdWithRewardTiers(projectId)
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
