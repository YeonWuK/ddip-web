package com.ddip.backend.entity;

import com.ddip.backend.dto.enums.AdminActionType;
import com.ddip.backend.dto.enums.AdminTargetType;
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
@Table(name = "admin_history")
public class AdminHistory extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 대상에 대한 액션인지 (PROJECT / AUCTION / USER / POINT 등)
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 30, nullable = false)
    private AdminTargetType targetType;

    // 대상의 PK (projectId, auctionId, userId ...)
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 어떤 액션인지 (PROJECT_REJECT, USER_BAN, AUCTION_FORCE_CLOSE 등)
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", length = 50, nullable = false)
    AdminActionType actionType;

    // 누가 했는지 (관리자 유저 id)
    @Column(name = "admin_id")
    private Long adminId;

    // 사유
    @Column(name = "reason", length = 500)
    private String reason;

    public static AdminHistory of(AdminTargetType targetType, Long targetId,
                                  AdminActionType actionType, Long adminId, String reason) {

        return AdminHistory.builder()
                .targetType(targetType)
                .targetId(targetId)
                .actionType(actionType)
                .adminId(adminId)
                .reason(reason)
                .build();
    }

}