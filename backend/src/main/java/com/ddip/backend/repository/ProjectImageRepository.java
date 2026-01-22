package com.ddip.backend.repository;

import com.ddip.backend.entity.ProjectImage;
import com.ddip.backend.repository.custom.ProjectImageCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long>, ProjectImageCustom {
}
