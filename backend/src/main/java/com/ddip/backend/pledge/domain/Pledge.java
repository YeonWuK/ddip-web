package com.ddip.backend.pledge.domain;

import com.ddip.backend.pledge.dto.enums.PledgeStatus;
import com.ddip.backend.common.domain.BaseTimeEntity;
import com.ddip.backend.project.exception.pledge.PledgeAccessDeniedException;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pledge")
public class Pledge extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 64)
    private String orderId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reward_tier_id")
    private Long rewardTierId;

    @Column(name = "paid_amount", nullable = false)
    private Long paidAmount;

    @Column(name = "buy_quantity", nullable = false)
    private Long purchasedQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private PledgeStatus status;

    public static Pledge toEntity(String orderId, Long userId, Long projectId,
                                  Long rewardTierId, long requiredAmount, long quantity) {
        return Pledge.builder()
                .orderId(orderId)
                .userId(userId)
                .projectId(projectId)
                .rewardTierId(rewardTierId)
                .paidAmount(requiredAmount)
                .purchasedQuantity(quantity)
                .status(PledgeStatus.PENDING)
                .build();
    }

    public void assertOwnedBy(Long requestUserId) {
        if (!this.userId.equals(requestUserId)) {
            throw new PledgeAccessDeniedException(this.id, requestUserId);
        }
    }

    public void assertCancelable() {
        if (this.status == PledgeStatus.CANCELED || this.status == PledgeStatus.REFUND) {
            throw new IllegalStateException("이미 취소된 후원입니다.");
        }
        // 결제 완료(PAID)까지만 취소 허용
        if (this.status == PledgeStatus.CONFIRMED || this.status == PledgeStatus.SHIPPED) {
            throw new IllegalStateException("이 결제는 이미 확정/배송 중이라 취소할 수 없습니다.");
        }
    }

    public void assertRefundable() {
        if (this.status != PledgeStatus.PAID) {
            throw new IllegalStateException("환불은 PAID 상태에서만 가능합니다. current=" + this.status);
        }
    }

    public void confirmedFunding(){
        this.status = PledgeStatus.CONFIRMED;
    }

    public void refundPledgeStatus(){
        this.status = PledgeStatus.REFUND;
    }

    public void shippedFunding(){
        this.status = PledgeStatus.SHIPPED;
    }

    public void paidFunding(){
        this.status = PledgeStatus.PAID;
    }
}
