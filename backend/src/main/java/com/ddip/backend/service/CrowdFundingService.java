package com.ddip.backend.service;

import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.ProjectResponseDto;
import com.ddip.backend.dto.crowd.ProjectUpdateRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.reward.RewardTierRequiredException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.AdminHistoryRepository;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CrowdFundingService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PledgeService pledgeService;
    private final AdminHistoryRepository adminHistoryRepository;

    public Project getProjectEntity(Long projectId){
        return projectRepository.findById(projectId).orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    // 어드민용
    public Project getProjectWithRewardTiersAndCreator(Long projectId) {
        return projectRepository.findByIdWithRewardTiersAndCreator(projectId).orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    /**
     *  Crowdfunding 프로젝트 생성
     */
    public long createProject(ProjectRequestDto requestDto, Long userId) {

        if (requestDto.getRewardTiers() == null || requestDto.getRewardTiers().isEmpty()) {
            throw new RewardTierRequiredException();
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
        Project project = Project.toEntity(requestDto, user);

        projectRepository.save(project);
        log.info("성공적으로 프로젝트가 생성되었습니다 projectId = {}", project.getId());
        return project.getId();
    }

    /**
     *  Crowdfunding 프로젝트 가져오기
     */
    @Transactional(readOnly = true)
    public ProjectResponseDto getProjects(Long projectId) {
        Project project = projectRepository.findByIdWithCreatorAndRewardTier(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        return ProjectResponseDto.from(project);
    }

    /**
     *  Crowdfunding 프로젝트 삭제
     */
    public void deleteProject(Long projectId, Long userId) {
        Project project = getProjectEntity(projectId);

        // 본인 프로젝트만 삭제 가능
        project.assertOwnedBy(userId);

        project.cancel();
        log.info("성공적으로 삭제 되었습니다. projectId={}", projectId);
    }

    /**
     *  Crowdfunding 전체 프로젝트 가져오기
     */
    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectResponseDto::from)
                .toList();
    }

    public void updateProject(Long projectId, Long userId, ProjectUpdateRequestDto requestDto) {

        Project project = getProjectEntity(projectId);

        // 본인 프로젝트만 수정 가능
        project.assertOwnedBy(userId);

        // DRAFT 상태일 때만 구조 수정 허용
        project.assertEditable();

        // 날짜 검증(둘 다 들어왔을 때만)
        if (requestDto.getStartAt() != null && requestDto.getEndAt() != null
                && !requestDto.getEndAt().isAfter(requestDto.getStartAt())) {
            log.info("날짜를 다시 확인하세요. projectId={}", projectId);
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
        }

        // 기본 필드 부분 수정
        project.updateFrom(requestDto);
    }

    public void openFunding(Long userId, Long projectId) {
//        관리자만 Open 시킬 것인가에 대한 논의

        Project project = getProjectEntity(projectId);

        project.assertOwnedBy(userId);

        // 상태 전이 검증 — DRAFT 만 허용
        project.assertStatus(ProjectStatus.DRAFT);

        if (project.getRewardTiers().isEmpty()) {
            throw new RewardTierRequiredException(projectId);
        }

        project.openFunding();
        log.info("성공적으로 open funding 상태가 되었습니다. projectId={}", projectId);
    }

    @Scheduled(cron = "59 59 23 * * *")
    public void closeExpireProjects(){

        LocalDate today = LocalDate.now();

        List<Project> expiredProjects = projectRepository.findByStatusAndEndAtLessThanEqual(ProjectStatus.OPEN, today);

        for (Project project : expiredProjects) {
            boolean success = project.closeProject();

            if (!success) {
                // 펀딩 실패 → 환불
                pledgeService.refundAllFailedProjects(project.getId());
            }
        }
    }

    public void rejectProjectByAdmin(Long projectId){
        Project project = getProjectEntity(projectId);
        project.rejectByAdmin();
    }

    public void forceStopByAdmin(Long projectId){
        Project project = getProjectEntity(projectId);
        project.stopProject();
    }

    public void forceCancelProjectByAdmin(Long projectId){
        Project project = getProjectEntity(projectId);
        project.cancel();
        pledgeService.refundAllFailedProjects(project.getId());
    }

    @Transactional(readOnly = true)
    public Page<Project> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        return projectRepository.searchProjectsForAdmin(condition, pageable);
    }


}
