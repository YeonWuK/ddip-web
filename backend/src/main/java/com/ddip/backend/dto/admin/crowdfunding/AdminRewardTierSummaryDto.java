package com.ddip.backend.dto.admin.crowdfunding;

import com.ddip.backend.entity.RewardTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRewardTierSummaryDto {

    private Long id;
    private Long projectId;

    private String title;
    private String description;

    private Long price;

    private Integer limitQuantity;   // null이면 무제한
    private Integer soldQuantity;    // 이미 팔린 수량

    private LocalDateTime createdAt;

    public static AdminRewardTierSummaryDto from(RewardTier rewardTier) {
        return AdminRewardTierSummaryDto.builder()
                .id(rewardTier.getId())
                .projectId(rewardTier.getProject().getId())
                .title(rewardTier.getTitle())
                .description(rewardTier.getDescription())
                .price(rewardTier.getPrice())
                .limitQuantity(rewardTier.getLimitQuantity())
                .soldQuantity(rewardTier.getSoldQuantity())
                .createdAt(rewardTier.getCreateTime())
                .build();
    }

}