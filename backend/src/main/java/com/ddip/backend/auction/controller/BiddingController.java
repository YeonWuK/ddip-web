package com.ddip.backend.auction.controller;

import com.ddip.backend.auction.dto.bids.BidsRequestDto;
import com.ddip.backend.auction.dto.bids.BidsResponseDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.auction.service.BidsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bid")
@Tag(name = "Bidding", description = "입찰 API")
public class BiddingController {

    private final BidsService bidsService;

    /**
     * 경매 참여
     */
    @PostMapping("/{auctionId}")
    @Operation(summary = "입찰 생성", description = "특정 경매에 입찰합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "입찰 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
    public ResponseEntity<?> createBidding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @PathVariable Long auctionId, @RequestBody BidsRequestDto dto) {

        BidsResponseDto bidsResponseDto = bidsService.createBid(customUserDetails.getUserId(), auctionId, dto);

        return ResponseEntity.ok(bidsResponseDto);
    }
}
