package com.ddip.backend.dto.admin.user;

import com.ddip.backend.dto.admin.auction.AdminAuctionSummaryDto;
import com.ddip.backend.dto.admin.auction.AdminBidSummaryDto;
import com.ddip.backend.dto.admin.crowdfunding.AdminPledgeSummaryDto;
import com.ddip.backend.dto.admin.point.AdminPointHistoryRepDto;
import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.Bids;
import com.ddip.backend.entity.Pledge;
import com.ddip.backend.entity.PointLedger;
import com.ddip.backend.entity.User;
import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {

    private AdminUserSummaryDto user;

    // 이 유저가 판매자로 등록한 경매들
    private List<AdminAuctionSummaryDto> sellingAuctions;

    // 이 유저가 입찰자로 참여한 입찰들
    private List<AdminBidSummaryDto> bids;

    // 이 유저가 후원자로 참여한 펀딩들
    private List<AdminPledgeSummaryDto> pledges;

    // 이 유저의 포인트 원장(거래) 이력
    private List<AdminPointHistoryRepDto> pointHistories;

    public static AdminUserDetailDto of(User user, List<Auction> sellingAuctions, List<Bids> bids,
                                        List<Pledge> pledges, List<PointLedger> ledgers) {

        return AdminUserDetailDto.builder()

                .user(AdminUserSummaryDto.from(user))

                .sellingAuctions(sellingAuctions.stream().map(AdminAuctionSummaryDto::from).toList())

                .bids(bids.stream().map(AdminBidSummaryDto::from).toList())

                .pledges(pledges.stream().map(AdminPledgeSummaryDto::from).toList())

                .pointHistories(ledgers.stream().map(AdminPointHistoryRepDto::from).toList())
                .build();
    }

}