package com.ddip.backend.dto.user;

import com.ddip.backend.dto.enums.BankType;
import com.ddip.backend.dto.enums.Role;
import com.ddip.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private Long id;
    private String email;
    private String username;
    private String nickname;
    private String phoneNumber;
    private String account;
    private String accountHolder;
    private Role role;
    private BankType bankType;
    private boolean isActive;

    public static UserResponseDto from(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .phoneNumber(user.getPhoneNumber())
                .account(user.getAccount())
                .accountHolder(user.getAccountHolder())
                .role(user.getRole())
                .bankType(user.getBankType())
                .isActive(user.isActive())
                .build();
    }
}