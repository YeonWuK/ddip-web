package com.ddip.backend.repository;

import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.entity.Pledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PledgeRepository extends JpaRepository<Pledge, Long> {
    List<Pledge> findByUserId(Long userId);
    List<Pledge> findByProjectIdAndStatus(Long projectId, PledgeStatus status);
    List<Pledge> findByProjectId(Long projectId);
}
