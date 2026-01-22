package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.ProjectImage;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.ddip.backend.entity.QProject.project;
import static com.ddip.backend.entity.QProjectImage.projectImage;

@RequiredArgsConstructor
public class ProjectImageCustomImpl implements ProjectImageCustom {

    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<ProjectImage> findImagesByProjectId(Long projectId) {
        return jpaQueryFactory
                .selectFrom(projectImage)
                .leftJoin(projectImage.project, project).fetchJoin()
                .where(
                        projectImage.project.id.eq(projectId)
                )
                .fetch();
    }

    @Override
    public List<ProjectImage> findImageIdsByProjectIdAndIds(Long projectId, List<Long> imageIds) {
        return jpaQueryFactory
                .selectFrom(projectImage)
                .leftJoin(projectImage.project, project).fetchJoin()
                .where(
                        projectImage.project.id.eq(projectId),
                        projectImage.id.in(imageIds)
                )
                .fetch();
    }
}
