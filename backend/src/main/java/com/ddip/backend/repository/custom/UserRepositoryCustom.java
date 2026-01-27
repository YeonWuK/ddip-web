package com.ddip.backend.repository.custom;

import com.ddip.backend.dto.admin.user.AdminUserSearchCondition;
import com.ddip.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepositoryCustom {
    Page<User> searchUsersForAdmin(AdminUserSearchCondition condition, Pageable pageable);
}
