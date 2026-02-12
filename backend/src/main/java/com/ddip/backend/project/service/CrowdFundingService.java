package com.ddip.backend.project.service;

import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.project.dto.crowd.project.ProjectDetailResponseDto;
import com.ddip.backend.project.dto.crowd.project.ProjectResponseDto;
import com.ddip.backend.project.dto.crowd.project.ProjectRequestDto;
import com.ddip.backend.project.dto.crowd.project.ProjectUpdateRequestDto;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.common.es.document.ProjectDocument;
import com.ddip.backend.common.es.repository.ProjectElasticsearchRepository;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.validation.project.ProjectNotFoundException;
import com.ddip.backend.project.validation.reward.RewardTierRequiredException;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import com.ddip.backend.project.repository.ProjectImageRepository;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.user.repository.UserRepository;
import com.ddip.backend.common.utils.AwsS3Util;
import com.ddip.backend.common.utils.S3UrlPrefixFactory;
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
        validateProjectUpdatable(project, userId, requestDto);

        // 1) 삭제 대상 확보 (썸네일이 삭제되는지 판단에 필요)
        List<ProjectImage> deleteTargets = resolveDeleteTargets(projectId, requestDto.getImageIds());

        // 2) 새 이미지 업로드 (있으면) + 새 썸네일 후보(첫 업로드 key) 리턴
        String newThumbKey = uploadNewImagesForUpdate(projectId, project, multipartFiles);

        // 3) 기존 이미지 삭제 (DB -> S3)
        deleteProjectImages(deleteTargets);

        // 4) 프로젝트 필드 업데이트
        project.updateFrom(requestDto);

        // 5) 썸네일 업데이트 (케이스 1~4 처리)
        updateThumbnailForUpdate(project, newThumbKey, deleteTargets);

        // 6) ES 동기화
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

        String newThumbKey = null;
        for (MultipartFile file : multipartFiles) {
            if (file == null || file.isEmpty())
                continue;

            String key = awsS3Util.uploadFile(file, prefix);
            if (newThumbKey == null)
                newThumbKey = key;

            projectImageRepository.save(ProjectImage.from(project, key));
        }

        return newThumbKey;
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
     */
    private void updateThumbnailForUpdate(Project project,
                                          String newThumbKey,
                                          List<ProjectImage> deleteTargets) {

        String currentThumb = project.getThumbnailUrl();

        boolean thumbDeleted = currentThumb != null
                && deleteTargets != null
                && deleteTargets.stream().anyMatch(img -> currentThumb.equals(img.getS3Key()));

        // 케이스4: 썸네일이 삭제되면 무조건 재선정
        if (thumbDeleted) {
            if (newThumbKey != null) {
                project.updateThumbnailUrl(newThumbKey);
                return;
            }
            project.updateThumbnailUrl(resolveFallbackThumbnailKey(project.getId()));
            return;
        }

        // 정책: 새 업로드가 있으면 새 업로드 대표로 교체, 없으면 유지
        if (newThumbKey != null) {
            project.updateThumbnailUrl(newThumbKey);
        }
    }

    /**
     * 첫 번째
     */
    private String resolveFallbackThumbnailKey(Long projectId) {
        return projectImageRepository.findImagesByProjectId(projectId).stream()
                .map(ProjectImage::getS3Key)
                .findFirst()
                .orElse(null);
    }
}