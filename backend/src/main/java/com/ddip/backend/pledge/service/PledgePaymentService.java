package com.ddip.backend.pledge.service;

import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.billing.service.PointService;
import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.RewardTier;
import com.ddip.backend.project.exception.reward.RewardNotFoundException;
import com.ddip.backend.project.repository.RewardTierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgePaymentService {

    private final PointService pointService;
    private final RewardTierRepository rewardTierRepository;

    /**
     * 결제 처리
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void processPayment(Pledge pledge, Project project, RewardTier rewardTier, int quantity) {
        usePointForPledge(pledge.getUserId(), pledge.getPaidAmount(), pledge.getId());
        pledge.paidFunding();
        project.increaseCurrentAmount(pledge.getPaidAmount());
        rewardTier.increaseSoldQuantity(quantity);
    }

    /**
     *
     * 단일 취소 (OPEN / STOP)
     * - 환불 + Project 집계 롤백 + RewardTier 집계 롤백
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void cancelAndRefund(Pledge pledge, Project project) {
        pledge.assertRefundable();    // PAID

        long amount = pledge.getPaidAmount();

        boolean refunded = refundPointForPledge(pledge.getUserId(), amount, pledge.getId());
        if (!refunded) {
            log.warn("Refund point for pledge {} was not refunded", pledge.getId());
            return;
        }
        pledge.refundPledgeStatus();

        project.decreaseCurrentAmount(amount);

        if (pledge.getRewardTierId() != null) {
            RewardTier tier = rewardTierRepository.findById(pledge.getRewardTierId())
                    .orElseThrow(() -> new RewardNotFoundException(pledge.getRewardTierId()));
            tier.decreaseSoldQuantity(pledge.getPurchasedQuantity());
        }
    }

    /**
     * 프로젝트 종료/실패로 인한 일괄 환불
     * - 환불만 수행
     * - Project / RewardTier 집계는 건드리지 않음
     *
     * ※ 상태 검증은 호출부에서 책임짐
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void refundPaidPledges(List<Pledge> pledges) {

        if (pledges == null || pledges.isEmpty()) {
            log.warn("Refund paid pledge list is empty");
            return;
        }

        for (Pledge pledge : pledges) {
            long amount = pledge.getPaidAmount();
            boolean refunded = refundPointForPledge(pledge.getUserId(), amount, pledge.getId());
            if (!refunded) {
                continue;
            }
            pledge.refundPledgeStatus();
        }
    }

    private void usePointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(
                userId,
                -amount,
                PointLedgerType.USE,
                PointLedgerSource.PLEDGE,
                pledgeId,
                "Pledge 결제 (pledgeId=" + pledgeId + ")"
        );
    }

    private boolean refundPointForPledge(Long userId, long amount, Long pledgeId) {
        return pointService.refundPointForPledgeIfAbsent(
                userId,
                amount,
                pledgeId,
                "Pledge 환불 (pledgeId=" + pledgeId + ")"
        );
    }
}
