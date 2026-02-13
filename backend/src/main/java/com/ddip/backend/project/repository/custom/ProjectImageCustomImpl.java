package com.ddip.backend.project.repository.custom;

import com.ddip.backend.project.domain.ProjectImage;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;

import static com.ddip.backend.project.domain.QProject.project;
import static com.ddip.backend.project.domain.QProjectImage.projectImage;


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

    @Override
    public Long clearMainByProjectId(Long projectId) {
        return jpaQueryFactory
                .update(projectImage)
                .set(projectImage.isMain, false)
                .where(projectImage.project.id.eq(projectId))
                .execute();

    }

    @Override
    public Long setMainById(Long imageId) {
        return jpaQueryFactory
                .update(projectImage)
                .set(projectImage.isMain, true)
                .where(projectImage.id.eq(imageId))
                .execute();
    }
}
