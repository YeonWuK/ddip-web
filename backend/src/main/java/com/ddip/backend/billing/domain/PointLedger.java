package com.ddip.backend.billing.domain;

import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.common.domain.BaseTimeEntity;
import com.ddip.backend.user.domain.User;
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
@Table(name = "point_ledger",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_point_ledger_reference_key", columnNames = "reference_key")
        }
)
public class PointLedger extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "change_amount", nullable = false)
    private Long changeAmount;

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "ledger_type", length = 30, nullable = false)
    private PointLedgerType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "ledger_source", length = 30, nullable = false)
    private PointLedgerSource source;

    // 멱등키 (SOURCE:TYPE:REFID[:USERID])
    @Column(name = "reference_key", length = 120, nullable = false)
    private String referenceKey;

    // 연관 도메인 PK는 그대로 유지(조회/디버깅 용)
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(length = 255)
    private String description;

    public static PointLedger toEntity(User user, long changeAmount, long balanceAfter, PointLedgerType type,
                                       PointLedgerSource source, String referenceKey, Long referenceId, String description) {
        return PointLedger.builder()
                .user(user)
                .changeAmount(changeAmount)
                .balanceAfter(balanceAfter)
                .type(type)
                .source(source)
                .referenceKey(referenceKey)
                .referenceId(referenceId)
                .description(description)
                .build();
    }
}