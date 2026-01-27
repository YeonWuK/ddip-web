package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.admin.user.AdminUserSearchCondition;
import com.ddip.backend.dto.enums.Role;
import com.ddip.backend.entity.QUser;
import com.ddip.backend.entity.User;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.util.List;

@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<User> searchUsersForAdmin(AdminUserSearchCondition condition, Pageable pageable) {
        QUser user = QUser.user;

        List<User> content = queryFactory
                .selectFrom(user)
                .where(
                        emailContains(condition.getEmail()),
                        usernameContains(condition.getUsername()),
                        nicknameContains(condition.getNickname()),
                        phoneNumberContains(condition.getPhoneNumber()),
                        roleEq(condition.getRole()),
                        activeEq(condition.getActive())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                // 필요하다면 Pageable의 Sort를 반영해도 됨 (여기선 id desc 고정)
                .orderBy(user.id.desc())
                .fetch();

        Long total = queryFactory
                .select(user.count())
                .from(user)
                .where(
                        emailContains(condition.getEmail()),
                        usernameContains(condition.getUsername()),
                        nicknameContains(condition.getNickname()),
                        phoneNumberContains(condition.getPhoneNumber()),
                        roleEq(condition.getRole()),
                        activeEq(condition.getActive())
                )
                .fetchOne();

        long totalCount = (total == null) ? 0L : total;

        return new PageImpl<>(content, pageable, totalCount);
    }

    private BooleanExpression emailContains(String email) {
        if (!StringUtils.hasText(email)) return null;
        return QUser.user.email.containsIgnoreCase(email);
    }

    private BooleanExpression usernameContains(String username) {
        if (!StringUtils.hasText(username)) return null;
        return QUser.user.username.containsIgnoreCase(username);
    }

    private BooleanExpression nicknameContains(String nickname) {
        if (!StringUtils.hasText(nickname)) return null;
        return QUser.user.nickname.containsIgnoreCase(nickname);
    }

    private BooleanExpression phoneNumberContains(String phoneNumber) {
        if (!StringUtils.hasText(phoneNumber)) return null;
        return QUser.user.phoneNumber.contains(phoneNumber);
    }

    private BooleanExpression roleEq(Role role) {
        if (role == null) return null;
        return QUser.user.role.eq(role);
    }

    private BooleanExpression activeEq(Boolean active) {
        if (active == null) return null;
        return QUser.user.isActive.eq(active);
    }

}