package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.AuthProvider;
import com.ddip.backend.dto.enums.BankType;
import com.ddip.backend.dto.enums.Role;
import com.ddip.backend.dto.oauth2.SocialUserRequestDto;
import com.ddip.backend.dto.user.ProfileRequestDto;
import com.ddip.backend.dto.user.UserRequestDto;
import com.ddip.backend.dto.user.UserUpdateRequestDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Slf4j
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

    @Column(name = "point_balance")
    private long pointBalance;

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

    // 포인트 적립/충전
    public void addPoint(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("적립 금액은 0보다 커야 합니다.");
        }
        this.pointBalance += amount;
    }

    // 포인트 차감
    public void subtractPoint(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("차감 금액은 0보다 커야 합니다.");
        }

        if (this.pointBalance < amount) {
            throw new IllegalStateException("포인트 잔액 부족: 현재 " + this.pointBalance + ", 필요 " + amount);
        }

        this.pointBalance -= amount;
    }

    // 잔액 충분한지 검증
    public void assertEnoughPoint(long required) {
        if (required <= 0) {
            log.info("요구 가격을 다시 확인해주세요. required: {}", required);
            throw new IllegalArgumentException("검증 금액은 0보다 커야 합니다.");
        }

        if (this.pointBalance < required) {
            log.info("포인트가 부족합니다.");
            throw new IllegalStateException("포인트 부족: 필요=" + required + ", 보유=" + this.pointBalance);
        }
    }

}