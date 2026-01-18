package com.ddip.backend.dto.user;

import com.ddip.backend.dto.auction.AuctionSummaryDto;
import com.ddip.backend.dto.bids.BidsResponseDto;
import com.ddip.backend.dto.mybids.MyBidsSummaryDto;
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

    private List<AuctionSummaryDto> auctions = new ArrayList<>();

    private List<BidsResponseDto> myBids = new ArrayList<>();

    private List<MyBidsSummaryDto> myMyBids = new ArrayList<>();
}
