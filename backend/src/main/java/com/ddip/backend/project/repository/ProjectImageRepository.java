package com.ddip.backend.project.repository;

import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.project.repository.custom.ProjectImageCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long>, ProjectImageCustom {
    boolean existsByIdAndProjectId(Long id, Long project_id);
}
