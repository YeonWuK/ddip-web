package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.exception.pledge.PledgeAccessDeniedException;
import com.ddip.backend.exception.reward.InvalidQuantityException;
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

    public void cancel() {
        this.status = PledgeStatus.CANCELED;
    }

    public static Pledge toEntity(User user, Project project, RewardTier rewardTier, int quantity) {

        if (quantity <= 0) {
            throw new InvalidQuantityException(quantity);
        }

        long unitPrice = rewardTier.getPrice();
        long amount = unitPrice * (long) quantity;

        return Pledge.builder()
                .user(user)
                .project(project)
                .rewardTier(rewardTier)
                .amount(amount)
                .status(PledgeStatus.CONFIRMED)
                .build();
    }

    public void assertOwnedBy(Long userId) {
        if (!this.user.getId().equals(userId)) throw new PledgeAccessDeniedException(this.id ,userId);
    }

    public void assertNotCanceled() {
        if (this.status == PledgeStatus.CANCELED) {
            throw new IllegalStateException("이미 취소된 후원입니다.");
        }
    }

}
