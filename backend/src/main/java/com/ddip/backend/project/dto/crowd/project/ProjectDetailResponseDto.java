package com.ddip.backend.project.dto.crowd.project;

import com.ddip.backend.project.dto.crowd.CreatorDto;
import com.ddip.backend.project.dto.crowd.reward.RewardTierResponseDto;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.dto.crowd.ProjectImageResponseDto;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponseDto {

    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
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
    private List<ProjectImageResponseDto> images = new ArrayList<>();
    private int achievementRate;

    public static ProjectDetailResponseDto from(Project project, List<ProjectImage> images) {
        int rate = 0;
        if (project.getTargetAmount() > 0) {
            rate = (int) ((project.getCurrentAmount() * 100) / project.getTargetAmount());
        }

        return ProjectDetailResponseDto.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .thumbnailUrl(project.getThumbnailUrl())
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
                                .toList())
                .achievementRate(rate)
                .images(
                        images.stream()
                                .map(ProjectImageResponseDto::from)
                                .toList()
                )
                .build();
    }

}

