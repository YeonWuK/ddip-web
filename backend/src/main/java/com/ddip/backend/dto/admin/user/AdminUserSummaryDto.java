package com.ddip.backend.dto.admin.user;

import com.ddip.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummaryDto {

    private Long id;
    private String email;
    private String username;
    private String nickname;
    private String phoneNumber;

    private String provider;      // AuthProvider
    private String role;          // Role

    private boolean active;       // isActive
    private long pointBalance;

    private LocalDateTime createdAt;

    public static AdminUserSummaryDto from(User user) {
        return AdminUserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phoneNumber(user.getPhoneNumber())
                .provider(user.getProvider() != null ? user.getProvider().name() : null)
                .role(user.getRole() != null ? user.getRole().name() : null)
                .active(user.isActive())
                .pointBalance(user.getPointBalance())
                .createdAt(user.getCreateTime())
                .build();
    }
}