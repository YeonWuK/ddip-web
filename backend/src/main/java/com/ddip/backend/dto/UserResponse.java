package com.ddip.backend.dto;

import com.ddip.backend.entity.User;
import com.ddip.backend.enums.BankType;
import com.ddip.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String nickname;
    private String phoneNumber;
    private String account;
    private String accountHolder;
    private Role role;
    private BankType bankType;
    private boolean isActive;

    public UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .nickname(user.getNickname())
                .phoneNumber(user.getPhoneNumber())
                .account(user.getAccount())
                .accountHolder(user.getAccountHolder())
                .role(user.getRole())
                .bankType(user.getBankType())
                .isActive(user.getIsActive())
                .build();
    }
}
