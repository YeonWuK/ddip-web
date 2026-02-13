package com.ddip.backend.project.domain;

import com.ddip.backend.common.domain.BaseTimeEntity;
import com.ddip.backend.project.exception.reward.InvalidQuantityException;
import com.ddip.backend.project.exception.reward.RewardMismatchException;
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
@Table(name = "reward_tiers")
public class RewardTier extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(length = 200, nullable = false)
    private String title;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Long price;

    @Column(name = "limit_quantity")
    private Long limitQuantity;

    @Builder.Default
    @Column(name = "sold_quantity", nullable = false)
    private Long soldQuantity = 0L;

    public void increaseSoldQuantity(int quantity) {
        if (quantity <= 0) {throw new InvalidQuantityException(quantity);}

        if (limitQuantity != null && soldQuantity + quantity > limitQuantity) {
            throw new IllegalStateException("리워드 수량이 모두 소진되었습니다.");}

        this.soldQuantity += quantity;
    }

    public void assertBelongsTo(Project project) {
        if (!this.project.getId().equals(project.getId())) {
            throw new RewardMismatchException(this.id, project.getId());
        }
    }

    public void decreaseSoldQuantity(Long quantity) {
        if (quantity <= 0) {throw new InvalidQuantityException(quantity);}
        this.soldQuantity -= quantity;
    }

}