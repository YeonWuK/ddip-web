package com.ddip.backend.project.service;

import com.ddip.backend.common.utils.AwsS3Util;
import com.ddip.backend.common.utils.S3UrlPrefixFactory;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.ProjectImage;
import com.ddip.backend.project.dto.project.ProjectUpdateRequestDto;
import com.ddip.backend.project.exception.image.InvalidProjectImageException;
import com.ddip.backend.project.repository.ProjectImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectImageService {

    private final AwsS3Util awsS3Util;
    private final S3UrlPrefixFactory s3UrlPrefixFactory;
    private final ProjectImageRepository projectImageRepository;

    public List<ProjectImage> findImagesByProjectId(Long projectId) {
        return projectImageRepository.findImagesByProjectId(projectId);
    }

    public void uploadProjectImagesAndSaveEntities(Project project, List<MultipartFile> files, int mainIndex) {
        if (files == null || files.isEmpty()) return;

        if (mainIndex < 0 || mainIndex >= files.size()) {
            throw new IllegalArgumentException("mainIndex 가 유효하지 않습니다.");
        }

        String prefix = s3UrlPrefixFactory.projectPrefix(project.getId());

        List<ProjectImage> projectImages = IntStream.range(0, files.size())
                .mapToObj(i -> {
                    MultipartFile file = files.get(i);
                    if (file == null || file.isEmpty()) {
                        throw new InvalidProjectImageException("사진은 하나 이상 등록되야합니다.");
                    }

                    String key = awsS3Util.uploadFile(file, prefix);
                    boolean isMain = (i == mainIndex);
                    return ProjectImage.from(project, key, isMain);
                })
                .filter(Objects::nonNull)
                .toList();

        projectImageRepository.saveAll(projectImages);
    }

    public List<ProjectImage> uploadNewImagesForUpdate(Long projectId, Project project, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        String prefix = s3UrlPrefixFactory.projectPrefix(projectId);

        List<ProjectImage> projectImages = files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .map(file -> ProjectImage.from(project, awsS3Util.uploadFile(file, prefix), false))
                .toList();

        return projectImageRepository.saveAll(projectImages);
    }

    public List<ProjectImage> resolveDeleteTargets(Long projectId, List<Long> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return List.of();
        }
        return projectImageRepository.findImageIdsByProjectIdAndIds(projectId, imageIds);
    }

    public void deleteProjectImages(List<ProjectImage> deleteTargets) {
        if (deleteTargets == null || deleteTargets.isEmpty()) {
            return;
        }
        projectImageRepository.deleteAll(deleteTargets);
        for (ProjectImage image : deleteTargets) {
            awsS3Util.deleteByKey(image.getS3Key());
        }
    }

    public void applyMainImageOrThrow(Long projectId, ProjectUpdateRequestDto dto, List<ProjectImage> uploaded) {
        boolean hasUploaded = uploaded != null && !uploaded.isEmpty();

        if (dto.getMainIndex() != null && dto.getMainImageId() != null) {
            throw new InvalidProjectImageException("mainIndex와 mainImageId는 동시에 보낼 수 없습니다.");
        }

        List<ProjectImage> projectImages = projectImageRepository.findImagesByProjectId(projectId);

        if (hasUploaded && projectImages.isEmpty()) {
            Integer mainIndex = dto.getMainIndex();
            if (mainIndex == null) {
                throw new InvalidProjectImageException("새 이미지를 업로드하면 mainIndex는 필수입니다.");
            }
            if (mainIndex < 0 || mainIndex >= uploaded.size()) {
                throw new InvalidProjectImageException("mainIndex가 업로드 파일 범위를 벗어났습니다.");
            }
            resetMain(projectId, uploaded.get(mainIndex).getId());
            return;
        }

        if (dto.getMainImageId() != null) {
            Long mainImageId = dto.getMainImageId();
            if (!projectImageRepository.existsByIdAndProjectId(mainImageId, projectId)) {
                throw new InvalidProjectImageException("해당 프로젝트의 이미지가 아닙니다.");
            }
            resetMain(projectId, mainImageId);
            return;
        }

        if (hasUploaded && dto.getMainIndex() != null) {
            int mainIndex = dto.getMainIndex();
            if (mainIndex < 0 || mainIndex >= uploaded.size()) {
                throw new InvalidProjectImageException("mainIndex가 업로드 파일 범위를 벗어났습니다.");
            }
            resetMain(projectId, uploaded.get(mainIndex).getId());
        }
    }

    public void syncProjectThumbnailFromMainOrThrow(Project project) {
        String key = projectImageRepository.findMainByProjectId(project.getId())
                .map(ProjectImage::getS3Key)
                .orElseThrow(() -> new InvalidProjectImageException("대표 이미지(isMain)를 찾을 수 없습니다."));
        project.updateThumbnailUrl(key);
    }

    private void resetMain(Long projectId, Long mainImageId) {
        projectImageRepository.clearMainByProjectId(projectId);
        projectImageRepository.setMainById(mainImageId);

    }
}
