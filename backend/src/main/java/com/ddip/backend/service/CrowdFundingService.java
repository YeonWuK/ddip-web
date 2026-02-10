package com.ddip.backend.service;

import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.dto.crowd.ProjectDetailResponseDto;
import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.ProjectResponseDto;
import com.ddip.backend.dto.crowd.ProjectUpdateRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.ProjectImage;
import com.ddip.backend.entity.User;
import com.ddip.backend.es.document.ProjectDocument;
import com.ddip.backend.es.repository.ProjectElasticsearchRepository;
import com.ddip.backend.event.ProjectEsEvent;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.reward.RewardTierRequiredException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.ProjectImageRepository;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.UserRepository;
import com.ddip.backend.utils.AwsS3Util;
import com.ddip.backend.utils.S3UrlPrefixFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CrowdFundingService {

    private final AwsS3Util awsS3Util;
    private final S3UrlPrefixFactory s3UrlPrefixFactory;
    private final ApplicationEventPublisher publisher;

    private final ProjectElasticsearchRepository projectElasticsearchRepository;
    private final ProjectImageRepository projectImageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PledgeService pledgeService;

    @Transactional(readOnly = true)
    public Project getProjectEntity(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    // 어드민용
    @Transactional(readOnly = true)
    public Project getProjectWithRewardTiersAndCreator(Long projectId) {
        return projectRepository.findByIdWithRewardTiersAndCreator(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }

    /**
     * Crowdfunding 프로젝트 단건 조회 (RewardTier 포함)
     */
    @Transactional(readOnly = true)
    public ProjectDetailResponseDto getProject(Long projectId) {
        Project project = projectRepository.findByIdWithCreatorAndRewardTier(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        List<ProjectImage> images = projectImageRepository.findImagesByProjectId(projectId);

        return ProjectDetailResponseDto.from(project, images);
    }

    /**
     * Crowdfunding 전체 프로젝트 조회
     */
    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<Project> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        return projectRepository.searchProjectsForAdmin(condition, pageable);
    }

    /**
     * Crowdfunding 프로젝트 생성
     */
    public long createProject(List<MultipartFile> multipartFiles, ProjectRequestDto requestDto, Long userId) {

        validateRewardTiers(requestDto);

        User user = getUserOrThrow(userId);
        Project project = createAndSaveProject(requestDto, user);

        String thumbnailUrl = uploadProjectImagesAndSaveEntities(project, multipartFiles);
        if (thumbnailUrl != null) {
            project.updateThumbnailUrl(thumbnailUrl);
        }

        // ES 인덱싱 (초기 생성은 바로 저장)
        indexProjectToElasticsearch(project, thumbnailUrl);

        log.info("프로젝트 생성 완료 projectId={}", project.getId());
        return project.getId();
    }

    /**
     * Crowdfunding 프로젝트 수정
     */
    public void updateProject(List<MultipartFile> multipartFiles, Long projectId, Long userId, ProjectUpdateRequestDto requestDto) {

        Project project = getProjectEntity(projectId);
        // 기본 검증 (소유자, 상태, 날짜)
        validateProjectUpdatable(project, userId, requestDto);

        // 삭제 대상 이미지 조회
        // 새 이미지 업로드, 새 이미지 없는 경우 그냥 Return.
        List<ProjectImage> deleteTargets = resolveDeleteTargets(projectId, requestDto.getImageIds());

        String newThumbnailUrl = uploadNewImagesForUpdate(projectId, project, multipartFiles);

        // 기존 이미지 삭제 (DB → S3)
        deleteProjectImages(deleteTargets);

        // 필드 업데이트
        project.updateFrom(requestDto);

        // 썸네일 업데이트
        updateThumbnailForUpdate(project, newThumbnailUrl, deleteTargets);

        // ES 동기화
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    /**
     * Crowdfunding 프로젝트 삭제
     */
    public void deleteProject(Long projectId, Long userId) {
        Project project = getProjectEntity(projectId);

        project.assertOwnedBy(userId);

        List<ProjectImage> images = projectImageRepository.findImagesByProjectId(projectId);

        for (ProjectImage image : images) {
            awsS3Util.deleteByKey(image.getS3Key());
        }

        projectElasticsearchRepository.deleteById(projectId);
        projectRepository.delete(project); // orphanRemoval에 의해 images도 같이 삭제

        log.info("프로젝트 삭제 완료 projectId={}", projectId);
    }

    @Scheduled(cron = "59 59 23 * * *")
    public void closeExpireProjects() {
        LocalDate today = LocalDate.now();
        List<Project> expired = projectRepository.findByStatusAndEndAtLessThanEqual(ProjectStatus.OPEN, today);

        for (Project project : expired) {
            boolean success = project.closeProject();
            if (!success) {
                pledgeService.refundAllFailedProjects(project.getId());
            }
            publisher.publishEvent(new ProjectEsEvent(project.getId()));
        }
    }

    public void rejectProjectByAdmin(Long projectId) {
        Project project = getProjectEntity(projectId);
        project.rejectByAdmin();
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    public void forceStopByAdmin(Long projectId) {
        Project project = getProjectEntity(projectId);
        project.stopProject();
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    public void forceCancelProjectByAdmin(Long projectId) {
        Project project = getProjectEntity(projectId);
        project.cancel();
        pledgeService.refundAllFailedProjects(projectId);
        publisher.publishEvent(new ProjectEsEvent(projectId));
    }

    private void validateRewardTiers(ProjectRequestDto requestDto) {
        if (requestDto.getRewardTiers() == null || requestDto.getRewardTiers().isEmpty()) {
            throw new RewardTierRequiredException();
        }
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Project createAndSaveProject(ProjectRequestDto requestDto, User user) {
        Project project = Project.toEntity(requestDto, user);
        return projectRepository.save(project);
    }

    /**
     * S3 업로드 + ProjectImage 저장 + 썸네일 key 반환
     */
    private String uploadProjectImagesAndSaveEntities(Project project, List<MultipartFile> multipartFiles) {
        if (multipartFiles == null || multipartFiles.isEmpty()) {
            return null;
        }

        String prefix = s3UrlPrefixFactory.projectPrefix(project.getId());
        String thumbnailUrl = null;

        for (MultipartFile file : multipartFiles) {
            String key = awsS3Util.uploadFile(file, prefix);
            if (thumbnailUrl == null) {
                thumbnailUrl = key;
            }
            projectImageRepository.save(ProjectImage.from(project, key));
        }
        return thumbnailUrl;
    }

    private void indexProjectToElasticsearch(Project project, String thumbnailUrl) {
        ProjectDocument document = ProjectDocument.from(project, thumbnailUrl);
        projectElasticsearchRepository.save(document);
    }

    /**
     * 프로젝트 수정 시 기본 검증 (소유자, 상태, 날짜)
     */
    private void validateProjectUpdatable(Project project, Long userId, ProjectUpdateRequestDto requestDto) {

        // 본인 프로젝트만 수정 가능
        project.assertOwnedBy(userId);
        // DRAFT 상태에서만 수정 가능
        project.assertEditable();
        // 날짜 검증 (둘 다 존재할 때만)
        if (requestDto.getStartAt() != null && requestDto.getEndAt() != null &&
                !requestDto.getEndAt().isAfter(requestDto.getStartAt())) {
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
        }
    }

    /**
     * 수정 시 삭제 대상 이미지 조회 (null / empty 방어)
     */
    private List<ProjectImage> resolveDeleteTargets(Long projectId, List<Long> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return List.of();
        }
        return projectImageRepository.findImageIdsByProjectIdAndIds(projectId, imageIds);
    }

    /**
     * 수정 시 새 이미지 업로드 처리 (없으면 null 반환)
     */
    private String uploadNewImagesForUpdate(Long projectId, Project project, List<MultipartFile> multipartFiles) {

        if (multipartFiles == null || multipartFiles.isEmpty()) {
            return null;
        }

        String prefix = s3UrlPrefixFactory.projectPrefix(projectId);
        String thumbnailUrl = null;

        for (MultipartFile file : multipartFiles) {
            String key = awsS3Util.uploadFile(file, prefix);
            if (thumbnailUrl == null) {
                thumbnailUrl = key;
            }
            projectImageRepository.save(ProjectImage.from(project, key));
        }
        return thumbnailUrl;
    }

    /**
     * 수정 시 기존 이미지 삭제 (DB → S3)
     */
    private void deleteProjectImages(List<ProjectImage> deleteTargets) {
        if (deleteTargets == null || deleteTargets.isEmpty()) {
            return;
        }
        projectImageRepository.deleteAll(deleteTargets);
        for (ProjectImage image : deleteTargets) {
            awsS3Util.deleteByKey(image.getS3Key());
        }
    }

    /**
     * 수정 시 썸네일 업데이트 로직
     * - 새 이미지가 있으면 그중 첫 번째를 썸네일로
     * - 새 이미지는 없지만 기존 썸네일이 삭제 대상에 포함된 경우 null로 초기화
     */
    private void updateThumbnailForUpdate(Project project, String newThumbnailUrl, List<ProjectImage> deletedImages) {

        String currentThumbnail = project.getThumbnailUrl();

        if (newThumbnailUrl != null) {
            project.updateThumbnailUrl(newThumbnailUrl);
            return;
        }

        if (currentThumbnail == null || deletedImages == null || deletedImages.isEmpty()) {
            return;
        }

        boolean thumbnailDeleted = deletedImages.stream()
                .anyMatch(img -> currentThumbnail.equals(img.getS3Key()));

        if (thumbnailDeleted) {
            project.updateThumbnailUrl(null);
        }
    }
}