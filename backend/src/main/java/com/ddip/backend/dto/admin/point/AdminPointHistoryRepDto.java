package com.ddip.backend.dto.admin.point;

import com.ddip.backend.entity.PointLedger;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPointHistoryRepDto {

    private Long id;

    // 유저 정보
    private Long userId;
    private String username;
    private String nickname;

    private Long changeAmount;

    // 이 트랜잭션 이후 잔액
    private Long balanceAfter;

    // 포인트 성격
    private String type;        // PointLedgerType
    private String source;      // PointLedgerSource

    // 연관 도메인
    private Long referenceId;   // pledgeId / auctionId / chargeId 등

    private String description;

    private LocalDateTime createdAt;

    public static AdminPointHistoryRepDto from(PointLedger ledger) {
        return AdminPointHistoryRepDto.builder()
                .id(ledger.getId())

                .userId(ledger.getUser().getId())
                .username(ledger.getUser().getUsername())
                .nickname(ledger.getUser().getNickname())

                .changeAmount(ledger.getChangeAmount())
                .balanceAfter(ledger.getBalanceAfter())

                .type(ledger.getType().name())
                .source(ledger.getSource().name())

                .referenceId(ledger.getReferenceId())
                .description(ledger.getDescription())

                .createdAt(ledger.getCreateTime())
                .build();
    }

}