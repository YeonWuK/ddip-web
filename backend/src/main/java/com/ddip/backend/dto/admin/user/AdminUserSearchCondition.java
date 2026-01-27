package com.ddip.backend.dto.admin.user;

import com.ddip.backend.dto.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSearchCondition {

    private String email;          // 이메일 부분 검색
    private String username;       // username 부분 검색
    private String nickname;       // 닉네임 부분 검색
    private String phoneNumber;    // 전화번호

    private Role role;
    private Boolean active;        // isActive

}