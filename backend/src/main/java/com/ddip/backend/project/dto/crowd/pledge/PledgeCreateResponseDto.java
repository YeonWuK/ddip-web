package com.ddip.backend.project.dto.crowd.pledge;

import com.ddip.backend.project.dto.enums.PledgeStatus;
import com.ddip.backend.project.domain.Pledge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PledgeCreateResponseDto {

    private Long projectId;
    private String orderId;
    private Long totalAmount;
    private List<PledgeItemResultDto> items;
    private LocalDateTime createdAt;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PledgeItemResultDto {
        private Long pledgeId;
        private Long rewardTierId;
        private Long quantity;
        private Long amount;
        private PledgeStatus status;
    }

    public static PledgeCreateResponseDto of(Long projectId, String orderId, List<Pledge> pledges) {
        long totalAmount = pledges.stream()
                .mapToLong(Pledge::getPaidAmount)
                .sum();

        List<PledgeItemResultDto> items = pledges.stream()
                .map(p -> PledgeItemResultDto.builder()
                        .pledgeId(p.getId())
                        .rewardTierId(p.getRewardTier() == null ? null : p.getRewardTier().getId())
                        .quantity(p.getPurchasedQuantity())
                        .amount(p.getPaidAmount())
                        .status(p.getStatus())
                        .build()
                )
                .toList();

        return PledgeCreateResponseDto.builder()
                .projectId(projectId)
                .totalAmount(totalAmount)
                .orderId(orderId)
                .items(items)
                .createdAt(LocalDateTime.now())
                .build();
    }
}