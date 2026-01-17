package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.ProjectResponseDto;
import com.ddip.backend.dto.crowd.RewardTierRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.RewardTier;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.project.InvalidProjectStatusException;
import com.ddip.backend.exception.project.ProjectAccessDeniedException;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.reward.RewardTierRequiredException;
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
            throw new RewardTierRequiredException();
        }

        User user = userService.getUser(userId);
        Project project = Project.toEntity(requestDto, user);

        projectRepository.save(project);
        log.info("성공적으로 프로젝트가 생성되었습니다 projectId = {}", project.getId());
        return project.getId();
    }

    /**
     *  Crowdfunding 프로젝트 가져오기
     */
    @Transactional(readOnly = true)
    public ProjectResponseDto getProject(Long projectId) {
        Project project = projectRepository.findByIdWithCreatorAndRewardTier(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        return ProjectResponseDto.from(project);
    }

    /**
     *  Crowdfunding 프로젝트 삭제
     */
    public void deleteProject(Long projectId, Long userId) {
        User user = userService.getUser(userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        // 본인 프로젝트만 삭제 가능
        if (!project.getCreator().getId().equals(user.getId())) {
            throw new ProjectAccessDeniedException(projectId, userId);
        }

        project.cancel();
        log.info("성공적으로 삭제 되었습니다. projectId={}", projectId);
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
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        Long creatorId = project.getCreator().getId();
        if (!creatorId.equals(userId)) {
            throw new ProjectAccessDeniedException(projectId, userId);
        }

        log.info("현재 프로젝트 상태 : {}", project.getStatus());
        // 상태 전이 검증
        ProjectStatus status = project.getStatus();

        if (status == ProjectStatus.OPEN) {
            // 이미 오픈이면 그대로 두기 (idempotent)
            log.info("이미 OPEN 된 상태 입니다. projectId={}", projectId);
            return;
        }

        if (status != ProjectStatus.DRAFT) {
            throw new InvalidProjectStatusException(status, ProjectStatus.DRAFT);
        }

        if (project.getRewardTiers() == null || project.getRewardTiers().isEmpty()) {
            throw new RewardTierRequiredException(projectId);
        }

        project.openFunding();
        log.info("성공적으로 open funding 상태가 되었습니다. projectId={}", projectId);
    }
}
