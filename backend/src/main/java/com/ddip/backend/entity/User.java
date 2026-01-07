package com.ddip.backend.entity;

import com.ddip.backend.dto.SocialUserRequestDto;
import com.ddip.backend.dto.enums.BankType;
import com.ddip.backend.dto.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user")
public class User extends BaseTimeEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "password")
    private String password;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "bank_type")
    @Enumerated(EnumType.STRING)
    private BankType bankType;

    @Column(name = "account")
    private String account;

    @Column(name = "account_holder")
    private String accountHolder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, orphanRemoval = true)
    private List<UserAddress> userAddresses = new ArrayList<>();

    public static User from(SocialUserRequestDto socialUserRequestDto) {
        return User.builder()
                .email(socialUserRequestDto.getEmail())
//                .provider(socialUserRequestDto.getProvider())
                .nickname(null)
                .username(socialUserRequestDto.getName())
                .role(socialUserRequestDto.getRole())
                .build();
    }
}