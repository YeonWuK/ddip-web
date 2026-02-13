package com.ddip.backend.project.repository.custom;

import com.ddip.backend.project.domain.ProjectImage;

import java.util.List;
import java.util.Optional;

public interface ProjectImageCustom {
    List<ProjectImage> findImagesByProjectId(Long projectId);

    List<ProjectImage> findImageIdsByProjectIdAndIds(Long projectId, List<Long> imageIds);

    Optional<ProjectImage> findMainByProjectId(Long projectId);

    void clearMainByProjectId(Long projectId);

    void setMainById(Long imageId);
}
