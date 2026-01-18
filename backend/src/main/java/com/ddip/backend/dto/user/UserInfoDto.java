package com.ddip.backend.dto.user;

import com.ddip.backend.dto.enums.BankType;
import com.ddip.backend.dto.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDto {

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
}
