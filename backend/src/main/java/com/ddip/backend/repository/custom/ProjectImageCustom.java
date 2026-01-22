package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.ProjectImage;

import java.util.List;

public interface ProjectImageCustom {
    List<ProjectImage> findImagesByProjectId(Long projectId);

    List<ProjectImage> findImageIdsByProjectIdAndIds(Long projectId, List<Long> imageIds);
}
