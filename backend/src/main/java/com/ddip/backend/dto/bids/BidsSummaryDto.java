package com.ddip.backend.dto.bids;

import com.ddip.backend.dto.user.UserResponseDto;
import com.ddip.backend.entity.Bids;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidsSummaryDto {

    private Long id;

    private UserResponseDto user;

    private Long price;

    public static BidsSummaryDto from(Bids bids) {
        return BidsSummaryDto.builder()
                .id(bids.getId())
                .user(UserResponseDto.from(bids.getUser()))
                .price(bids.getPrice())
                .build();
    }
}