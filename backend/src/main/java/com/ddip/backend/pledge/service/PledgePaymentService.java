package com.ddip.backend.pledge.service;

import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.billing.service.PointService;
import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.pledge.dto.enums.PledgeStatus;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.RewardTier;
import com.ddip.backend.project.exception.reward.RewardNotFoundException;
import com.ddip.backend.project.repository.RewardTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgePaymentService {

    private final PointService pointService;
    private final RewardTierRepository rewardTierRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void processPayment(Pledge pledge, Project project, RewardTier rewardTier, int quantity) {
        usePointForPledge(pledge.getUserId(), pledge.getPaidAmount(), pledge.getId());
        pledge.paidFunding();
        project.increaseCurrentAmount(pledge.getPaidAmount());
        rewardTier.increaseSoldQuantity(quantity);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void cancelAndRefund(Pledge pledge, Project project) {
        pledge.assertRefundable();
        long amount = pledge.getPaidAmount();

        refundPointForPledge(pledge.getUserId(), amount, pledge.getId());
        pledge.refundPledgeStatus();
        project.decreaseCurrentAmount(amount);

        if (pledge.getRewardTierId() != null) {
            RewardTier tier = rewardTierRepository.findById(pledge.getRewardTierId())
                    .orElseThrow(() -> new RewardNotFoundException(pledge.getRewardTierId()));
            tier.decreaseSoldQuantity(pledge.getPurchasedQuantity());
        }
    }

    private void usePointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, -amount,
                PointLedgerType.USE, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 결제 (pledgeId=" + pledgeId + ")");
    }

    private void refundPointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, amount,
                PointLedgerType.REFUND, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 환불 (pledgeId=" + pledgeId + ")");
    }
}

