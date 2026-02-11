package com.ddip.backend.user.dto.user;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.auction.dto.auction.AuctionResponseDto;
import com.ddip.backend.auction.dto.bids.BidsSummaryDto;
import com.ddip.backend.auction.dto.mybids.MyBidsSummaryDto;
import com.ddip.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPageResponseDto {

    private UserResponseDto user;

    private List<AuctionResponseDto> auctions = new ArrayList<>();

    private List<BidsSummaryDto> bids = new ArrayList<>();

    private List<MyBidsSummaryDto> myBids = new ArrayList<>();

    public static UserPageResponseDto from(User user, List<Auction> auctions,
                                           List<BidsSummaryDto> bids, List<MyBidsSummaryDto> myBids) {
        return UserPageResponseDto.builder()
                .user(UserResponseDto.from(user))
                .auctions(auctions.stream()
                        .map(AuctionResponseDto::from)
                        .toList())
                .bids(bids)
                .myBids(myBids)
                .build();
    }
}