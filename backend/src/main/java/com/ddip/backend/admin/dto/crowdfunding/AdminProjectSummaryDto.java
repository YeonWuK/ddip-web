package com.ddip.backend.admin.dto.crowdfunding;

import com.ddip.backend.project.domain.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProjectSummaryDto {

    private Long id;

    // 크리에이터 정보
    private Long creatorId;

    private String title;
    private String summary;         // 카드/리스트용 소개

    private Long targetAmount;
    private Long currentAmount;

    private String status;          // ProjectStatus

    private LocalDate startAt;
    private LocalDate endAt;

    private String thumbnailUrl;
    private String categoryPath;
    private String tags;            // "캠핑,초경량,텐트"

    private Long likeCount;

    private Long totalPledgeCount;
    private Double achievementRate;

    private LocalDateTime createdAt;

    public static AdminProjectSummaryDto from(Project project) {
        return AdminProjectSummaryDto.builder()
                .id(project.getId())
                .creatorId(project.getCreatorId())
                .title(project.getTitle())
                .summary(project.getSummary())
                .targetAmount(project.getTargetAmount())
                .currentAmount(project.getCurrentAmount())
                .status(project.getStatus().name())
                .startAt(project.getStartAt())
                .endAt(project.getEndAt())
                .thumbnailUrl(project.getThumbnailUrl())
                .categoryPath(project.getCategoryPath())
                .tags(project.getTags())
                .likeCount(project.getLikeCount())
                .createdAt(project.getCreateTime())
                .build();
    }

}