package com.ddip.backend.dto.crowd;

import com.ddip.backend.entity.RewardTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardTierResponseDto {

    private Long rewardTierId;
    private String title;
    private String description;
    private Long price;
    private Long limitQuantity;
    private Long soldQuantity;
    private boolean soldOut;

    public static RewardTierResponseDto from(RewardTier tier) {
        boolean soldOut = tier.getLimitQuantity() != null
                && tier.getSoldQuantity() >= tier.getLimitQuantity();

        return RewardTierResponseDto.builder()
                .rewardTierId(tier.getId())
                .title(tier.getTitle())
                .description(tier.getDescription())
                .price(tier.getPrice())
                .limitQuantity(tier.getLimitQuantity())
                .soldQuantity(tier.getSoldQuantity())
                .soldOut(soldOut)
                .build();
    }
}
