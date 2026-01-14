package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.ProjectResponseDto;
import com.ddip.backend.dto.crowd.RewardTierRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.RewardTier;
import com.ddip.backend.entity.User;
import com.ddip.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CrowdFundingService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    /**
     *  Crowdfunding 프로젝트 생성
     */
    public long createProject(ProjectRequestDto requestDto, Long userId) {

        if (requestDto.getRewardTiers() == null || requestDto.getRewardTiers().isEmpty()) {
            throw new IllegalArgumentException("리워드는 최소 1개 이상 필요합니다.");
        }

        User user = userService.getUser(userId);
        Project project = Project.from(requestDto, user);

        for (RewardTierRequestDto tierDto : requestDto.getRewardTiers()) {
            RewardTier tier = RewardTier.builder()
                    .project(project)
                    .title(tierDto.getTitle())
                    .description(tierDto.getDescription())
                    .price(tierDto.getPrice())
                    .limitQuantity(tierDto.getLimitQuantity())
                    .build();

            project.getRewardTiers().add(tier);
        }

        projectRepository.save(project);
        log.info("successfully created project with id {}", project.getId());
        return project.getId();
    }

    /**
     *  Crowdfunding 프로젝트 가져오기
     */
    @Transactional(readOnly = true)
    public ProjectResponseDto getProject(Long projectId) {
        Project project = projectRepository.findByIdWithCreatorAndRewardTier(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        return ProjectResponseDto.from(project);
    }

    /**
     *  Crowdfunding 프로젝트 삭제
     */
    public void deleteProject(Long projectId, Long userId) {
        User user = userService.getUser(userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // 본인 프로젝트만 삭제 가능
        if (!project.getCreator().getId().equals(user.getId())) {
            throw new IllegalStateException("본인 프로젝트만 삭제할 수 있습니다.");
        }

        log.info("successfully deleted project with id {}", projectId);
        project.cancel();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectResponseDto::from)
                .toList();
    }

   /* public void updateProject(Long projectId, Long userId, ProjectUpdateRequestDto requestDto) {
        User user = userService.getUser(userId);

        Project project = projectRepository.findByIdWithRewardTiers(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // 본인 프로젝트만 수정 가능
        if (!project.getCreator().getId().equals(user.getId())) {
            throw new IllegalStateException("본인 프로젝트만 수정할 수 있습니다.");
        }

        // 날짜 검증(둘 다 들어왔을 때만)
        if (requestDto.getStartAt() != null && requestDto.getEndAt() != null
                && !requestDto.getEndAt().isAfter(requestDto.getStartAt())) {
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
        }

        // 기본 필드 부분 수정
        project.update(requestDto);

        // 리워드 수정(1차: 전체 교체 전략)
        if (requestDto.getRewardTiers() != null) {
            if (requestDto.getRewardTiers().isEmpty()) {
                throw new IllegalArgumentException("리워드는 최소 1개 이상 필요합니다.");
            }

            project.clearRewardTiers();
            for (RewardTierRequestDto tierDto : requestDto.getRewardTiers()) {
                RewardTier tier = RewardTier.builder()
                        .title(tierDto.getTitle())
                        .description(tierDto.getDescription())
                        .price(tierDto.getPrice())
                        .limitQuantity(tierDto.getLimitQuantity())
                        .build();

                project.addRewardTier(tier);
            }
        }*/

    public void openFunding(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다. projectId=" + projectId));

        Long creatorId = project.getCreator().getId();
        if (!creatorId.equals(userId)) {
            throw new IllegalArgumentException("프로젝트 작성자만 오픈할 수 있습니다.");
        }

        log.info("현재 프로젝트 상태 : {}", project.getStatus());
        // 상태 전이 검증
        ProjectStatus status = project.getStatus();

        if (status == ProjectStatus.OPEN) {
            // 이미 오픈이면 그대로 두기 (idempotent)
            return;
        }

        if (status != ProjectStatus.DRAFT) {
            throw new IllegalStateException("DRAFT 상태의 프로젝트만 OPEN으로 전환할 수 있습니다. 현재 상태=" + status);
        }

         if (project.getRewardTiers() == null || project.getRewardTiers().isEmpty()) {
             throw new IllegalStateException("리워드가 1개 이상 등록되어야 오픈할 수 있습니다.");
         }

        // 4) 상태 변경 (더티체킹으로 반영)
        project.openFunding();
        log.info("successfully open funding for project with id {}", projectId);
    }
}
