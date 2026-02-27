package com.ddip.backend.billing.service;

import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.billing.domain.PointLedger;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.user.validation.user.InsufficientPointException;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import com.ddip.backend.billing.repository.PointLedgerRepository;
import com.ddip.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PointService {

    private final UserRepository userRepository;
    private final PointLedgerRepository pointLedgerRepository;

    private User getUserForUpdate(Long userId) {
        return userRepository.findByIdForUpdate(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    /**
     * 공용 포인트 변경 (비멱등)
     * - 사용/충전 등 일반적인 포인트 변경에 사용
     */
    @Transactional
    public void changePoint(Long userId, long delta, PointLedgerType type, PointLedgerSource source, Long referenceId, String description) {

        if (delta == 0) {
            throw new IllegalArgumentException("delta(포인트 변화량)는 0이 될 수 없습니다.");
        }

        User user = getUserForUpdate(userId);
        long before = user.getPointBalance();

        if (delta > 0) {
            user.addPoint(delta);
        } else {
            long abs = Math.abs(delta);
            if (before < abs) {
                throw new InsufficientPointException(user.getId(), abs, before);
            }
            user.subtractPoint(abs);
        }

        long after = user.getPointBalance();

        String referenceKey = buildNonIdempotentReferenceKey(source, type, referenceId, user.getId());

        PointLedger ledger = PointLedger.toEntity(user, delta, after, type, source, referenceKey, referenceId, description);

        pointLedgerRepository.save(ledger);

        log.info("포인트 변경 기록: userId={}, delta={}, balanceAfter={}, type={}, source={}, refKey={}, refId={}",
                user.getId(), delta, after, type, source, referenceKey, referenceId);
    }

    /**
     * Pledge 환불 멱등 처리
     * - 같은 pledgeId에 대해 환불은 1회만 반영
     * - 이미 처리된 환불이면 false 반환
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean refundPointForPledgeIfAbsent(Long userId, long amount, Long pledgeId, String description) {

        if (amount <= 0) {
            throw new IllegalArgumentException("amount는 0보다 커야 합니다.");
        }
        if (pledgeId == null) {
            throw new IllegalArgumentException("pledgeId는 null일 수 없습니다.");
        }

        String referenceKey = buildPledgeRefundKey(pledgeId);

        User user = getUserForUpdate(userId);
        long before = user.getPointBalance();
        long after = before + amount;

        // 1. ledger 먼저 선삽입 (멱등키 선점)
        PointLedger ledger = PointLedger.toEntity(
                user,
                amount,
                after, // 이미 계산된 최종 잔액
                PointLedgerType.REFUND,
                PointLedgerSource.PLEDGE,
                referenceKey,
                pledgeId,
                description
        );

        try {
            pointLedgerRepository.save(ledger);
            // 여기까지 성공하면, 이 트랜잭션이 "멱등키 선점"에 성공한 것
        } catch (DataIntegrityViolationException e) {
            // 같은 reference_key로 이미 누군가 선점
            log.warn("중복 Pledge 환불 감지(멱등 처리). userId={}, pledgeId={}", userId, pledgeId);
            return false;
        }

        // 2. 이제 포인트 잔액 실제 반영
        user.addPoint(amount);

        log.info("Pledge 환불 포인트 처리 완료 userId={}, pledgeId={}, amount={}", userId, pledgeId, amount);
        return true;
    }

    public List<PointLedger> getLedgersByUser(Long userId) {
        User user = getUser(userId);
        return pointLedgerRepository.findByUserOrderByIdDesc(user);
    }

    public Page<PointLedger> getLedgersByUser(Long userId, Pageable pageable) {
        User user = getUser(userId);
        return pointLedgerRepository.findByUserOrderByIdDesc(user, pageable);
    }

    private String buildNonIdempotentReferenceKey(PointLedgerSource source, PointLedgerType type, Long referenceId, Long userId) {
        return source + ":" + type + ":" + referenceId + ":" + userId + ":" + UUID.randomUUID();
    }

    private String buildPledgeRefundKey(Long pledgeId) {
        return "PLEDGE:REFUND:" + pledgeId;
    }
}
