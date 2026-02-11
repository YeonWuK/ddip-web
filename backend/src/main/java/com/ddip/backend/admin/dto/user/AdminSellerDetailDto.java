package com.ddip.backend.admin.dto.user;

import com.ddip.backend.admin.dto.auction.AdminAuctionSummaryDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSellerDetailDto {

    private AdminUserSummaryDto seller;

    private List<AdminAuctionSummaryDto> auctions;

    private List<AdminProjectSummaryDto> projects;

    public static AdminSellerDetailDto of(User seller, List<Auction> auctions, List<Project> projects) {
        return AdminSellerDetailDto.builder()
                .seller(AdminUserSummaryDto.from(seller))
                .auctions(auctions.stream()
                        .map(AdminAuctionSummaryDto::from)
                        .toList())
                .projects(projects.stream()
                        .map(AdminProjectSummaryDto::from)
                        .toList())
                .build();
    }
}