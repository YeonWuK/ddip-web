package com.ddip.backend.entity;

import com.ddip.backend.exception.address.AddressAccessDeniedException;
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
@Table(name = "user_addresses")
public class UserAddress extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 라벨 (집/회사 등)
    @Column(length = 30)
    private String label;

    @Column(name = "recipient_name", length = 100, nullable = false)
    private String recipientName;

    @Column(length = 20, nullable = false)
    private String phone;

    @Column(name = "zip_code", length = 10, nullable = false)
    private String zipCode;

    // 도로명/지번 주소
    @Column(length = 255, nullable = false)
    private String address1;

    // 상세 주소
    @Column(length = 255, nullable = false)
    private String address2;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public void update(String label, String recipientName, String phone, String zipCode, String address1, String address2) {
        this.label = label; this.recipientName = recipientName; this.phone = phone;
        this.zipCode = zipCode; this.address1 = address1; this.address2 = address2;
    }

    public void markDefault() {
        this.isDefault = true;
    }

    public void unmarkDefault() {
        this.isDefault = false;
    }

    // 본인의 것만 접근할 수 있는 검증 로직
    public void assertOwnedBy(Long userId) {
        if (!userId.equals(getUser().getId())) throw new AddressAccessDeniedException(id, userId);
    }
}