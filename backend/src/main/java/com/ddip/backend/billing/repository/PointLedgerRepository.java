package com.ddip.backend.billing.repository;

import com.ddip.backend.billing.domain.PointLedger;
import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointLedgerRepository extends JpaRepository<PointLedger, Long> {
    List<PointLedger> findByUserOrderByIdDesc (User user);
    Page<PointLedger> findByUserOrderByIdDesc(User user, Pageable pageable);
    boolean existsByReferenceKey(String referenceKey);
}
