package com.ddip.backend.dto.crowd;

import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponseDto {

    private Long id;
    private String title;
    private String description;
    private Long targetAmount;
    private Long currentAmount;
    private ProjectStatus status;
    private LocalDate startAt;
    private LocalDate endAt;
    private String categoryPath;
    private String tags;
    private String summary;
    private CreatorDto creator;
    private List<RewardTierResponseDto> rewardTiers;

    public static ProjectResponseDto from(Project project){
        return ProjectResponseDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .status(project.getStatus())
                .startAt(project.getStartAt())
                .endAt(project.getEndAt())
                .categoryPath(project.getCategoryPath())
                .tags(project.getTags())
                .summary(project.getSummary())
                .creator(CreatorDto.from(project.getCreator()))
                .rewardTiers(
                        project.getRewardTiers().stream()
                                .map(RewardTierResponseDto::from)
                                .toList()
                )
                .build();
    }

}
