package com.ddip.backend.admin.dto.crowdfunding;

import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.pledge.dto.enums.PledgeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPledgeSummaryDto {

    private Long pledgeId;
    private String orderId;

    private Long projectId;
    private Long rewardTierId;

    private Long paidAmount;
    private Long quantity;
    private PledgeStatus status;

    private LocalDateTime createdAt;

    public static AdminPledgeSummaryDto from(Pledge pledge) {
        return AdminPledgeSummaryDto.builder()
                .pledgeId(pledge.getId())
                .orderId(pledge.getOrderId())
                .projectId(pledge.getProjectId())
                .rewardTierId(pledge.getRewardTierId())
                .paidAmount(pledge.getPaidAmount())
                .quantity(pledge.getPurchasedQuantity())
                .status(pledge.getStatus())
                .createdAt(pledge.getCreateTime())
                .build();
    }

}