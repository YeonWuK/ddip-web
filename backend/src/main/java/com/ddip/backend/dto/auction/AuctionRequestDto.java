package com.ddip.backend.dto.auction;

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
}