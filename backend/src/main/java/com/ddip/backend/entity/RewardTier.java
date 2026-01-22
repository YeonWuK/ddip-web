package com.ddip.backend.entity;

import com.ddip.backend.exception.reward.InvalidQuantityException;
import com.ddip.backend.exception.reward.RewardMismatchException;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "reward_tiers")
public class RewardTier extends BaseTimeEntity{

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
    private Integer limitQuantity; // null이면 무제한

    @Column(name = "sold_quantity", nullable = false)
    private Integer soldQuantity = 0; // 캐시

    @Builder.Default
    @OneToMany(mappedBy = "rewardTier")
    private List<Pledge> pledges = new ArrayList<>();

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

}