package com.ddip.backend.repository;

import com.ddip.backend.entity.Pledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PledgeRepository extends JpaRepository<Pledge, Long> {
    List<Pledge> findByUserId(Long userId);
}
