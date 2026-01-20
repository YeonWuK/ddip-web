package com.ddip.backend.entity;

import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.RewardTierRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.exception.project.InvalidProjectStatusException;
import com.ddip.backend.exception.project.ProjectAccessDeniedException;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "projects")
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 프로젝트 만든 사람(판매자)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(length = 200, nullable = false)
    private String title;

    // 프로젝트 상세 설명(긴 텍스트)
    @Lob
    private String description;

    @Column(name = "target_amount", nullable = false)
    private Long targetAmount;

    @Builder.Default
    @Column(name = "current_amount", nullable = false)
    private Long currentAmount = 0L; // 캐시(실제 근거는 pledges 합계)

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ProjectStatus status;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "category_path", length = 100)
    private String categoryPath;

    // 검색 보강용 태그(쉼표로 구분: "캠핑,초경량,텐트")
    @Column(name = "tags", length = 500)
    private String tags;

    // 카드/리스트용 짧은 소개
    @Column(name = "summary", length = 200)
    private String summary;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RewardTier> rewardTiers = new ArrayList<>();

    @OneToMany(mappedBy = "project")
    @Builder.Default
    private List<Pledge> pledges = new ArrayList<>();

    public static Project toEntity(ProjectRequestDto requestDto, User creator) {
        Project project = Project.builder()
                //Not null
                .title(requestDto.getTitle())
                .description(requestDto.getDescription())
                .targetAmount(requestDto.getTargetAmount())
                .creator(creator)
                // 일정
                .startAt(requestDto.getStartAt())
                .endAt(requestDto.getEndAt())
                // 노출/검색용
//                .thumbnailUrl(thumbnailUrl)
                .categoryPath(requestDto.getCategoryPath())
                .tags(requestDto.getTags())
                .summary(requestDto.getSummary())
                // 상태/캐시 값
                .status(ProjectStatus.DRAFT)
                .currentAmount(0L)
                .build();

        requestDto.getRewardTiers().forEach(project::addRewardTier);

        return project;
    }

    public void addRewardTier(RewardTierRequestDto dto) {
        RewardTier tier = RewardTier.builder()
                .project(this)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .limitQuantity(dto.getLimitQuantity())
                .build();

        this.rewardTiers.add(tier);
    }

    public void increaseCurrentAmount(long amount) {
        this.currentAmount += amount;
    }

    public void decreaseCurrentAmount(long amount) {
        long nextAmount = this.currentAmount - amount;
        // 음수 방지 (데이터 깨짐 방어)
        this.currentAmount = Math.max(nextAmount, 0L);
    }

    public void cancel() {
        this.status = ProjectStatus.CANCELED;
    }

    public void openFunding() {
        this.status = ProjectStatus.OPEN;
    }

    public void assertOwnedBy(Long userId) {
        if (!this.getCreator().getId().equals(userId)) throw new ProjectAccessDeniedException(this.id ,userId);
    }

    public void assertOpen() {
        if (this.status != ProjectStatus.OPEN) {throw new InvalidProjectStatusException(this.status, ProjectStatus.OPEN);}
    }

}