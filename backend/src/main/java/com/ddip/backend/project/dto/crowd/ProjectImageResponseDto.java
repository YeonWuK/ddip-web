package com.ddip.backend.project.dto.crowd;

import com.ddip.backend.project.domain.ProjectImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectImageResponseDto {

    private Long id;

    private String key;

    public static ProjectImageResponseDto from(ProjectImage projectImage) {
        return ProjectImageResponseDto.builder()
                .id(projectImage.getId())
                .key(projectImage.getS3Key())
                .build();
    }
}