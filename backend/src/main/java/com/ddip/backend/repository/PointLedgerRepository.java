package com.ddip.backend.repository;

import com.ddip.backend.entity.PointLedger;
import com.ddip.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointLedgerRepository extends JpaRepository<PointLedger, Integer> {
    List<PointLedger> findByUserOrderByIdDesc (User user);
}
