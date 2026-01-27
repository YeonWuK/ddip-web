package com.ddip.backend.repository;

import com.ddip.backend.entity.PointLedger;
import com.ddip.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointLedgerRepository extends JpaRepository<PointLedger, Long> {
    List<PointLedger> findByUserOrderByIdDesc (User user);
    Page<PointLedger> findByUserOrderByIdDesc(User user, Pageable pageable);
}