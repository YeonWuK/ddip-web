package com.ddip.backend.project.repository;

import com.ddip.backend.project.domain.RewardTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RewardTierRepository extends JpaRepository<RewardTier, Long> {
}
