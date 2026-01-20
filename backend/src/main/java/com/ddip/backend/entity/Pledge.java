package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.exception.reward.InvalidQuantityException;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
    private RewardTier rewardTier; // null 가능

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "donate_price")
    private Long donatePrice;

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
                .status(PledgeStatus.PENDING)
                .build();
    }

}
