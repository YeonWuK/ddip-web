package com.ddip.backend.dto.crowd;

import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.dto.image.ProjectImageResponseDto;
import com.ddip.backend.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    private List<ProjectImageResponseDto> images = new ArrayList<>();
    private int achievementRate;

    public static ProjectResponseDto from(Project project){
        int rate = 0;
        if (project.getTargetAmount() > 0) {
            rate = (int) ((project.getCurrentAmount() * 100) / project.getTargetAmount());
        }

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
                                .toList())
                .achievementRate(rate)
                .build();
    }

}
