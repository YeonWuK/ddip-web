package com.ddip.backend.project.domain;

import com.ddip.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "project_image")
public class ProjectImage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    @Column(name = "is_main", nullable = false)
    private boolean isMain;

    public static ProjectImage from(Project project, String key, boolean isMain) {
        return ProjectImage.builder()
                .project(project)
                .s3Key(key)
                .isMain(isMain)
                .build();
    }

}