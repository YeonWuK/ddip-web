package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.AuthProvider;
import com.ddip.backend.dto.enums.BankType;
import com.ddip.backend.dto.enums.Role;
import com.ddip.backend.dto.oauth2.SocialUserRequestDto;
import com.ddip.backend.dto.user.ProfileRequestDto;
import com.ddip.backend.dto.user.UserRequestDto;
import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.dto.user.UserUpdateRequestDto;
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

    @Column(name = "provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

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
    private boolean isActive;

    @Builder.Default
    @OneToMany(mappedBy = "creator", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<Project> projects = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<Pledge> pledges = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<UserAddress> addresses = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "seller", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<Auction> auctions = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<MyBids> myBids = new ArrayList<>();

    public static User from(UserRequestDto dto) {
        return User.builder()
                .email(dto.getEmail())
                .password(dto.getPassword())
                .username(dto.getUsername())
                .nickname(dto.getNickname())
                .phoneNumber(dto.getPhoneNumber())
                .provider(AuthProvider.LOCAL)
                .role(Role.USER)
                .bankType(dto.getBankType())
                .account(dto.getAccount())
                .accountHolder(dto.getAccountHolder())
                .isActive(true)
                .build();
    }

    public static User from(SocialUserRequestDto dto) {
        return User.builder()
                .email(dto.getEmail())
                .username("TMP")
                .nickname(dto.getNickname())
                .phoneNumber("TMP")
                .provider(AuthProvider.valueOf(dto.getProvider()))
                .role(dto.getRole())
                .isActive(false)
                .build();
    }

    public void updateProfile(ProfileRequestDto dto) {
        this.username = dto.getUsername();
        this.nickname = dto.getNickname();
        this.phoneNumber = dto.getPhoneNumber();
    }

    public void setIsActive() {
        this.isActive = true;
    }

    public void update(UserUpdateRequestDto updateRequest) {
        this.email = updateRequest.getEmail();
        this.password = updateRequest.getPassword();
        this.username = updateRequest.getUsername();
        this.nickname = updateRequest.getNickname();
        this.phoneNumber = updateRequest.getPhoneNumber();
        this.account = updateRequest.getAccount();
        this.accountHolder = updateRequest.getAccountHolder();
        this.bankType = updateRequest.getBankType();
    }

    public void updatePassword(String password) {
        this.password = password;
    }
}