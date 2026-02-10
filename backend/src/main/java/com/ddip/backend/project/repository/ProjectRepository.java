package com.ddip.backend.project.repository;

import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.repository.custom.ProjectRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, ProjectRepositoryCustom {
    Optional<Project> findById(Long id);
    List<Project> findByStatusAndEndAtLessThanEqual(ProjectStatus status, LocalDate endAt);
}
