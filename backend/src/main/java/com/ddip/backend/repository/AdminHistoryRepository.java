package com.ddip.backend.repository;

import com.ddip.backend.entity.AdminHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminHistoryRepository extends JpaRepository<AdminHistory, Integer> {
}
