package com.ddip.backend.project.repository;

import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.repository.custom.ProjectRepositoryCustom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, ProjectRepositoryCustom {
    Optional<Project> findById(Long id);
    List<Project> findByStatusAndEndAtLessThanEqual(ProjectStatus status, LocalDate endAt);
    List<Project> findByCreatorId(Long creatorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p where p.id = :id")
    Optional<Project> findByIdForUpdate(Long id);
}
