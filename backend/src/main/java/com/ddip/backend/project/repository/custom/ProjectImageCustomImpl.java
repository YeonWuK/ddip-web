package com.ddip.backend.project.repository.custom;

import com.ddip.backend.project.domain.ProjectImage;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

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
    public Optional<ProjectImage> findMainByProjectId(Long projectId) {
        return Optional.ofNullable(
                jpaQueryFactory
                .selectFrom(projectImage)
                        .where(
                                projectImage.project.id.eq(projectId),
                                projectImage.isMain.isTrue()
                        )
                        .fetchFirst());
    }

    @Override
    public void clearMainByProjectId(Long projectId) {
        jpaQueryFactory
                .update(projectImage)
                .set(projectImage.isMain, false)
                .where(projectImage.project.id.eq(projectId))
                .execute();

    }

    @Override
    public void setMainById(Long imageId) {
        jpaQueryFactory
                .update(projectImage)
                .set(projectImage.isMain, true)
                .where(projectImage.id.eq(imageId))
                .execute();
    }
}
