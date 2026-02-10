package com.ddip.backend.project.repository.custom;

import com.ddip.backend.project.domain.ProjectImage;

import java.util.List;

public interface ProjectImageCustom {
    List<ProjectImage> findImagesByProjectId(Long projectId);

    List<ProjectImage> findImageIdsByProjectIdAndIds(Long projectId, List<Long> imageIds);
}
