package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "point_ledger")
public class PointLedger extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 이번 트랜잭션으로 변한 포인트 양
     *  - 양수: 적립/충전/환불
     *  - 음수: 사용/차감
     */
    @Column(name = "change_amount", nullable = false)
    private Long changeAmount;

    // 이 트랜잭션 처리 이후의 최종 잔액 스냅샷
    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "ledger_type", length = 30, nullable = false)
    private PointLedgerType type;

    // 거래 출처(어느 도메인에서 발생했는지)
    @Enumerated(EnumType.STRING)
    @Column(name = "ledger_source", length = 30, nullable = false)
    private PointLedgerSource source;

    /**
     * 연관된 도메인의 PK
     * - source = PLEDGE  -> pledgeId
     * - source = AUCTION -> auctionId
     * - source = CHARGE  -> chargeRequestId 등
     * 없으면 null 가능
     */
    @Column(name = "reference_id")
    private Long referenceId;

    /**
     * 예: "프로젝트 #12 후원 결제", "경매 #3 낙찰 결제" 등
     */
    @Column(length = 255)
    private String description;

    public static PointLedger toEntity(User user, long changeAmount, long balanceAfter, PointLedgerType type,
                                       PointLedgerSource source, Long referenceId, String description) {
        return PointLedger.builder()
                .user(user)
                .changeAmount(changeAmount)
                .balanceAfter(balanceAfter)
                .type(type)
                .source(source)
                .referenceId(referenceId)
                .description(description)
                .build();
    }
}