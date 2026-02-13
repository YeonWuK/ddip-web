package com.ddip.backend.admin.dto.crowdfunding;

import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.RewardTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProjectDetailDto {

    private AdminProjectSummaryDto project;

    private List<AdminRewardTierSummaryDto> rewardTiers;

    private List<AdminPledgeSummaryDto> pledges;

    public static AdminProjectDetailDto of(Project project, List<RewardTier> rewardTiers, List<Pledge> pledges) {
        return AdminProjectDetailDto.builder()

                .project(AdminProjectSummaryDto.from(project))

                .rewardTiers(rewardTiers.stream().map(AdminRewardTierSummaryDto::from).toList())

                .pledges(pledges.stream().map(AdminPledgeSummaryDto::from).toList())
                .build();
    }

}