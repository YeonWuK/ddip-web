package com.ddip.backend.dto.bids;

import com.ddip.backend.entity.Auction;
import com.ddip.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateMyBidsDto {

    private User user;

    private Auction auction;

    private Long price;
}
