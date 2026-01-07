package com.ddip.backend.dto;

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
public class UserRequestDto {

    private String email;
    private String password;
    private String name;
    private String nickname;
    private String phoneNumber;
    private String account;
    private String accountHolder;
    private Role role;
    private BankType bankType;

}
