package com.ddip.backend.project.repository.custom;

import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.project.domain.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ProjectRepositoryCustom {
    Optional<Project> findByIdWithCreatorAndRewardTier(Long projectId);
    Optional<Project> findByIdWithRewardTiersAndCreator(Long projectId);
    Page<Project> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable);
}
