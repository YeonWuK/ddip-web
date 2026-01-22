package com.ddip.backend.service;

import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.entity.PointLedger;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.user.InsufficientPointException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.PointLedgerRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PointService {

    private final UserRepository userRepository;
    private final PointLedgerRepository pointLedgerRepository;

    private User getUser(Long userId) {return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));}

    private void applyPointChange(User user, long delta, PointLedgerType type,
                                  PointLedgerSource source, Long referenceId, String description) {

        if (delta == 0) {
            log.info("포인트 변화량이 0입니다. ledger 기록 스킵. userId={}, type={}, source={}, ref={}",
                    user.getId(), type, source, referenceId);
            return;
        }

        // 실 잔액 변경
        if (delta > 0) {
            user.addPoint(delta);
        } else {
            long abs = Math.abs(delta);
            if (user.getPointBalance() < abs) {
                throw new InsufficientPointException(user.getId(), abs, user.getPointBalance());
            }
            user.subtractPoint(abs);
        }

        long finalBalance = user.getPointBalance();

        PointLedger ledger = PointLedger.toEntity(user, delta, finalBalance, type, source, referenceId, description);

        pointLedgerRepository.save(ledger);

        log.info("포인트 변경 기록: userId={}, delta={}, balanceAfter={}, type={}, source={}, ref={}",
                user.getId(), delta, finalBalance, type, source, referenceId);
    }

    /**
     * 모든 포인트 변경 처리(사용/환불/충전 등)
     */
    public void changePoint(Long userId, long delta, PointLedgerType type,
                            PointLedgerSource source, Long referenceId, String description) {

        if (delta == 0) {
            throw new IllegalArgumentException("delta(포인트 변화량)는 0이 될 수 없습니다.");
        }

        User user = getUser(userId);

        applyPointChange(user, delta, type, source, referenceId, description);
    }

    @Transactional(readOnly = true)
    public long getBalance(Long userId) {
        User user = getUser(userId);
        return user.getPointBalance();
    }

    @Transactional(readOnly = true)
    public List<PointLedger> getHistory(Long userId) {
        User user = getUser(userId);
        return pointLedgerRepository.findByUserOrderByIdDesc(user);
    }

}
