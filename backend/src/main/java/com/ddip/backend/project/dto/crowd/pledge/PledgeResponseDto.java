package com.ddip.backend.project.dto.crowd.pledge;

import com.ddip.backend.project.dto.enums.PledgeStatus;
import com.ddip.backend.project.domain.Pledge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PledgeResponseDto {

    private Long pledgeId;
    private Long rewardTierId;
    private Long paidAmount;
    private PledgeStatus status;
    private LocalDateTime createdAt;

    public static PledgeResponseDto from(Pledge pledge) {
        return PledgeResponseDto.builder()
                .pledgeId(pledge.getId())
                .rewardTierId(pledge.getRewardTierId())
                .paidAmount(pledge.getPaidAmount())
                .status(pledge.getStatus())
                .createdAt(pledge.getCreateTime())
                .build();
    }
}