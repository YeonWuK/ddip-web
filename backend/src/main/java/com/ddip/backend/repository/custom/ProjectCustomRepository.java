package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Project;

import java.util.Optional;

public interface ProjectCustomRepository {
    Optional<Project> findByIdWithCreatorAndRewardTier(Long projectId);
}
