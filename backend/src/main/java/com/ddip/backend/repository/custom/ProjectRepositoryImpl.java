package com.ddip.backend.repository.custom;

import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.QProject;
import com.ddip.backend.entity.QRewardTier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@RequiredArgsConstructor
public class ProjectRepositoryImpl implements ProjectCustomRepository {

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
}
