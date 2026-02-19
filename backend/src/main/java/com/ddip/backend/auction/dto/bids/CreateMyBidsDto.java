package com.ddip.backend.auction.dto.bids;

import com.ddip.backend.auction.domain.Auction;
import com.ddip.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateMyBidsDto {

    private User user;

    private Long auctionId;
}
