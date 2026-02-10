package com.ddip.backend.user.repository.custom;

import com.ddip.backend.admin.dto.user.AdminUserSearchCondition;
import com.ddip.backend.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepositoryCustom {
    Page<User> searchUsersForAdmin(AdminUserSearchCondition condition, Pageable pageable);
}
