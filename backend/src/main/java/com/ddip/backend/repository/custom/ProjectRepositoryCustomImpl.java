package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.QProject;
import com.ddip.backend.entity.QRewardTier;
import com.ddip.backend.entity.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class ProjectRepositoryCustomImpl implements ProjectRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<Project> findByIdWithCreatorAndRewardTier(Long projectId) {
        QProject p = QProject.project;
        QRewardTier rt = QRewardTier.rewardTier;

        Project result = queryFactory
                .selectFrom(p)
                .join(p.creator).fetchJoin()
                .leftJoin(p.rewardTiers, rt).fetchJoin()
                .where(p.id.eq(projectId))
                .distinct()
                .fetchOne();

        return Optional.ofNullable(result);
    }

    @Override
    public Optional<Project> findByIdWithRewardTiersAndCreator(Long projectId) {
        QProject project = QProject.project;
        QRewardTier rewardTier = QRewardTier.rewardTier;
        QUser user = QUser.user;

        Project result = queryFactory
                .selectFrom(project)
                .leftJoin(project.creator, user).fetchJoin()
                .leftJoin(project.rewardTiers, rewardTier).fetchJoin()
                .where(project.id.eq(projectId))
                .distinct()
                .fetchOne();

        return Optional.ofNullable(result);
    }

    @Override
    public Page<Project> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        QProject project = QProject.project;
        QUser creator = QUser.user;

        List<Project> content = queryFactory
                .selectFrom(project)
                .leftJoin(project.creator, creator).fetchJoin()
                .where(
                        titleContains(condition.getTitle()),
                        creatorEmailContains(condition.getCreatorEmail()),
                        creatorUsernameContains(condition.getCreatorUsername()),
                        statusEq(condition.getStatus()),
                        categoryPathContains(condition.getCategoryPath()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(project.id.desc()) // 필요하면 pageable.getSort() 반영 가능
                .fetch();

        // count 조회
        Long total = queryFactory
                .select(project.count())
                .from(project)
                .leftJoin(project.creator, creator)
                .where(
                        titleContains(condition.getTitle()),
                        creatorEmailContains(condition.getCreatorEmail()),
                        creatorUsernameContains(condition.getCreatorUsername()),
                        statusEq(condition.getStatus()),
                        categoryPathContains(condition.getCategoryPath()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .fetchOne();

        long totalCount = (total == null) ? 0L : total;

        return new PageImpl<>(content, pageable, totalCount);
    }

    private BooleanExpression titleContains(String title) {
        if (!StringUtils.hasText(title)) return null;
        return QProject.project.title.containsIgnoreCase(title);
    }

    private BooleanExpression creatorEmailContains(String email) {
        if (!StringUtils.hasText(email)) return null;
        return QProject.project.creator.email.containsIgnoreCase(email);
    }

    private BooleanExpression creatorUsernameContains(String username) {
        if (!StringUtils.hasText(username)) return null;
        return QProject.project.creator.username.containsIgnoreCase(username);
    }

    /**
     * condition.status (String) → ProjectStatus 변환
     * 예: "OPEN", "CLOSED" 등
     */
    private BooleanExpression statusEq(String statusStr) {
        if (!StringUtils.hasText(statusStr)) return null;

        ProjectStatus status;
        try {
            status = ProjectStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            // 잘못된 값이면 조건에서 제외 (혹은 예외 던지도록 바꿔도 됨)
            return null;
        }

        return QProject.project.status.eq(status);
    }

    private BooleanExpression categoryPathContains(String categoryPath) {
        if (!StringUtils.hasText(categoryPath)) return null;
        // "캠핑/텐트" 전체 or 일부 검색: contains / startsWith 등 전략에 맞게
        return QProject.project.categoryPath.containsIgnoreCase(categoryPath);
    }

    private BooleanExpression startAtFrom(LocalDate from) {
        if (from == null) return null;
        return QProject.project.startAt.goe(from);
    }

    private BooleanExpression startAtTo(LocalDate to) {
        if (to == null) return null;
        return QProject.project.startAt.loe(to);
    }

}


