package com.ddip.backend.dto.admin.crowdfunding;

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
public class AdminPledgeSummaryDto {

    private Long id;

    // 프로젝트 정보
    private Long projectId;
    private String projectTitle;

    // 후원자 정보
    private Long userId;
    private String username;
    private String nickname;

    // 리워드 티어(선택적)
    private Long rewardTierId;
    private String rewardTierTitle;

    // 금액 / 상태
    private Long amount;
    private String status;

    private LocalDateTime createdAt;

    public static AdminPledgeSummaryDto from(Pledge pledge) {
        return AdminPledgeSummaryDto.builder()
                .id(pledge.getId())

                .projectId(pledge.getProject().getId())
                .projectTitle(pledge.getProject().getTitle())

                .userId(pledge.getUser().getId())
                .username(pledge.getUser().getUsername())
                .nickname(pledge.getUser().getNickname())

                .rewardTierId(pledge.getRewardTier().getId())
                .rewardTierTitle(pledge.getRewardTier().getTitle())

                .amount(pledge.getAmount())
                .status(pledge.getStatus().name())

                .createdAt(pledge.getCreateTime())
                .build();
    }

}
