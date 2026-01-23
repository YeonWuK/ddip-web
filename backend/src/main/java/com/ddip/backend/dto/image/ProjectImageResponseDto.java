package com.ddip.backend.dto.image;

import com.ddip.backend.entity.ProjectImage;
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
