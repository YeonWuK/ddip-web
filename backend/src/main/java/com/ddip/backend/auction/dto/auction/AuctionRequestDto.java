package com.ddip.backend.auction.dto.auction;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionRequestDto {

    private String title;

    private String description;

    private Long startPrice;

    private int bidStep;

    private String endAt;

    @Min(0)
    private int mainIndex;
}