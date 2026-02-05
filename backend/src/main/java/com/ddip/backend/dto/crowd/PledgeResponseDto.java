package com.ddip.backend.dto.crowd;

import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.entity.Pledge;
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
    private Long projectId;
    private Long userId;
    private Long rewardTierId;
    private Long amount;
    private PledgeStatus status;
    private LocalDateTime createdAt;

    public static PledgeResponseDto from(Pledge pledge) {
        return PledgeResponseDto.builder()
                .pledgeId(pledge.getId())
                .projectId(pledge.getProject().getId())
                .userId(pledge.getUser().getId())
                .rewardTierId(pledge.getRewardTier() == null ? null : pledge.getRewardTier().getId())
                .amount(pledge.getPaidAmount())
                .status(pledge.getStatus())
                .createdAt(pledge.getCreateTime())
                .build();
    }
}