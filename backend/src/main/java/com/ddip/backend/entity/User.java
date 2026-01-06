package com.ddip.backend.entity;

import com.ddip.backend.enums.BankType;
import com.ddip.backend.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "nickname", nullable = false)
    private String nickname;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "bank_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private BankType bankType;

    @Column(name = "account", nullable = false)
    private String account;

    @Column(name = "account_holder", nullable = false)
    private String accountHolder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}