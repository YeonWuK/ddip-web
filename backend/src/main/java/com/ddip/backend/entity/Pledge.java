package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.exception.pledge.PledgeAccessDeniedException;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_tier_id")
    private RewardTier rewardTier;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private PledgeStatus status;

    public static Pledge toEntity(User user, Project project, RewardTier rewardTier, long requiredAmount) {
        return Pledge.builder()
                .user(user)
                .project(project)
                .rewardTier(rewardTier)
                .amount(requiredAmount)
                .status(PledgeStatus.PENDING)
                .build();
    }

    public void assertOwnedBy(Long userId) {
        if (!this.user.getId().equals(userId)) throw new PledgeAccessDeniedException(this.id ,userId);
    }

    public void assertCancelable() {
        if (this.status == PledgeStatus.CANCELED) {
            throw new IllegalStateException("이미 취소된 후원입니다.");
        }
        // 결제 완료(PAID)까지만 취소 허용
        if (this.status == PledgeStatus.CONFIRMED || this.status == PledgeStatus.SHIPPED) {
            throw new IllegalStateException("이 결제는 이미 확정/배송 중이라 취소할 수 없습니다.");
        }
    }

    public void confirmedFunding(){
        this.status = PledgeStatus.CONFIRMED;
    }

    public void canceledFunding(){
        this.status = PledgeStatus.CANCELED;
    }

    public void shippedFunding(){
        this.status = PledgeStatus.SHIPPED;
    }

    public void paidFunding(){
        this.status = PledgeStatus.PAID;
    }
}
