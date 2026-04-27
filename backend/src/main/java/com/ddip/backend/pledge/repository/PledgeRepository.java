package com.ddip.backend.pledge.repository;

import com.ddip.backend.pledge.dto.enums.PledgeStatus;
import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.project.domain.Project;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PledgeRepository extends JpaRepository<Pledge, Long> {
    List<Pledge> findByUserId(Long userId);
    List<Pledge> findByProjectIdAndStatus(Long projectId, PledgeStatus status);
    List<Pledge> findByProjectId(Long projectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pledge p where p.id = :id")
    Optional<Pledge> findByIdForUpdate(@Param("id") Long id);

    @Query("select count(distinct p.userId) from Pledge p where p.projectId = :projectId and p.status = 'COMPLETED'")
    long countBackersByProjectId(@Param("projectId") Long projectId);
}