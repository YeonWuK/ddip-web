package com.ddip.backend.admin.repository;

import com.ddip.backend.admin.domain.AdminHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminHistoryRepository extends JpaRepository<AdminHistory, Integer> {
}
