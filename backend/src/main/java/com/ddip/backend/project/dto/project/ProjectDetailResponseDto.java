package com.ddip.backend.project.dto.project;

import com.ddip.backend.project.dto.CreatorDto;
import com.ddip.backend.project.dto.reward.RewardTierResponseDto;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.dto.ProjectImageResponseDto;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.user.domain.User;
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
    private CreatorDto creator;
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
    private List<RewardTierResponseDto> rewardTiers;
    private List<ProjectImageResponseDto> images = new ArrayList<>();
    private int achievementRate;

    public static ProjectDetailResponseDto from(Project project, User creator, List<ProjectImage> images) {
        int rate = 0;
        if (project.getTargetAmount() > 0) {
            rate = (int) ((project.getCurrentAmount() * 100) / project.getTargetAmount());
        }

        return ProjectDetailResponseDto.builder()
                .id(project.getId())
                .creator(CreatorDto.from(creator))
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

