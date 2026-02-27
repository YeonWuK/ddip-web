package com.ddip.backend.project.repository.custom;

import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.project.domain.QProject;
import com.ddip.backend.project.domain.QRewardTier;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.user.domain.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.hibernate.LockOptions;
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
    public Optional<Project> findByIdWithRewardTiers(Long projectId) {
        QProject project = QProject.project;
        QRewardTier rewardTier = QRewardTier.rewardTier;

        Project result = queryFactory
                .selectFrom(project)
                .distinct()
                .leftJoin(project.rewardTiers, rewardTier).fetchJoin()
                .where(project.id.eq(projectId))
                .fetchOne();

        return Optional.ofNullable(result);
    }

    @Override
    public List<Project> findExpiredOpenProjectsForUpdate(LocalDate today, int batchSize) {
        QProject project = QProject.project;

        JPAQuery<Project> query = queryFactory
                .selectFrom(project)
                .where(
                        project.status.eq(ProjectStatus.OPEN),
                        project.endAt.loe(today)
                )
                .orderBy(project.id.asc())
                .limit(batchSize);

        // FOR UPDATE
        query.setLockMode(LockModeType.PESSIMISTIC_WRITE);

        query.setHint("jakarta.persistence.lock.timeout", LockOptions.SKIP_LOCKED);

        return query.fetch();
    }

    @Override
    public Page<Project> searchProjectsForAdmin(AdminProjectSearchCondition condition, Pageable pageable) {
        QProject project = QProject.project;
        QUser user = QUser.user;

        // content
        List<Project> content = queryFactory
                .selectFrom(project)
                .leftJoin(user).on(user.id.eq(project.creatorId))
                .where(
                        titleContains(condition.getTitle()),
                        creatorEmailContains(user, condition.getCreatorEmail()),
                        creatorUsernameContains(user, condition.getCreatorUsername()),
                        statusEq(condition.getStatus()),
                        categoryPathContains(condition.getCategoryPath()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(project.id.desc())
                .fetch();

        // count (join 동일하게 맞추는 게 안전)
        Long total = queryFactory
                .select(project.count())
                .from(project)
                .leftJoin(user).on(user.id.eq(project.creatorId))
                .where(
                        titleContains(condition.getTitle()),
                        creatorEmailContains(user, condition.getCreatorEmail()),
                        creatorUsernameContains(user, condition.getCreatorUsername()),
                        statusEq(condition.getStatus()),
                        categoryPathContains(condition.getCategoryPath()),
                        startAtFrom(condition.getStartFrom()),
                        startAtTo(condition.getStartTo())
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    private BooleanExpression titleContains(String title) {
        if (!StringUtils.hasText(title)) return null;
        return QProject.project.title.containsIgnoreCase(title);
    }

    private BooleanExpression creatorEmailContains(QUser user, String email) {
        if (!StringUtils.hasText(email)) return null;
        return user.email.containsIgnoreCase(email);
    }

    private BooleanExpression creatorUsernameContains(QUser user, String username) {
        if (!StringUtils.hasText(username)) return null;
        return user.username.containsIgnoreCase(username);
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
