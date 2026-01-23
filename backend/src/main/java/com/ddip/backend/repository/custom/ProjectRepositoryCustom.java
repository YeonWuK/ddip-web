package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Project;

import java.util.Optional;

public interface ProjectRepositoryCustom {
    Optional<Project> findByIdWithCreatorAndRewardTier(Long projectId);
}
