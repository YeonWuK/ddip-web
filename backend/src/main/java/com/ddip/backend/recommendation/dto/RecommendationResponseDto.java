package com.ddip.backend.recommendation.dto;

import com.ddip.backend.project.domain.Project;
import com.ddip.backend.user.dto.enums.UserType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendationResponseDto {

    private Long projectId;
    private String title;
    private String summary;
    private String thumbnailUrl;
    private String categoryPath;
    private Long targetAmount;
    private Long currentAmount;
    private double score; // TOPSIS 근접도 점수
    private UserType userType;

    public static RecommendationResponseDto of(Project project, double score, UserType userType) {
        return RecommendationResponseDto.builder()
                .projectId(project.getId())
                .title(project.getTitle())
                .summary(project.getSummary())
                .thumbnailUrl(project.getThumbnailUrl())
                .categoryPath(project.getCategoryPath())
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .score(score)
                .userType(userType)
                .build();
    }
}
