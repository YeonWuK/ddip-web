package com.ddip.backend.admin.dto.user;

import com.ddip.backend.admin.dto.auction.AdminBidSummaryDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminPledgeSummaryDto;
import com.ddip.backend.admin.dto.point.AdminPointHistoryRepDto;
import com.ddip.backend.auction.domain.Bids;
import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.billing.domain.PointLedger;
import com.ddip.backend.user.domain.User;
import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {

    private AdminUserSummaryDto user;

    // 이 유저가 입찰자로 참여한 입찰들
    private List<AdminBidSummaryDto> bids;

    // 이 유저가 후원자로 참여한 펀딩들
    private List<AdminPledgeSummaryDto> pledges;

    // 이 유저의 포인트 원장(거래) 이력
    private List<AdminPointHistoryRepDto> pointHistories;

    public static AdminUserDetailDto of(User user, List<Bids> bids, List<Pledge> pledges, List<PointLedger> ledgers) {

        return AdminUserDetailDto.builder()

                .user(AdminUserSummaryDto.from(user))

                .bids(bids.stream().map(AdminBidSummaryDto::from).toList())

                .pledges(pledges.stream().map(AdminPledgeSummaryDto::from).toList())

                .pointHistories(ledgers.stream().map(AdminPointHistoryRepDto::from).toList())
                .build();
    }

}