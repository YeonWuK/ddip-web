package com.ddip.backend.auction.controller;

import com.ddip.backend.auction.dto.bids.BidsRequestDto;
import com.ddip.backend.auction.dto.bids.BidsResponseDto;
import com.ddip.backend.common.exception.ErrorResponse;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.auction.service.BidsService;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @ApiResponse(
                    responseCode = "200",
                    description = "입찰 성공",
                    content = @Content(schema = @Schema(implementation = BidsResponseDto.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "요청 값 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 필요",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "경매를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<?> createBidding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @PathVariable Long auctionId, @RequestBody BidsRequestDto dto) {

        bidsService.createBid(customUserDetails.getUserId(), auctionId, dto);

        return ResponseEntity.ok("Successfully created bid.");
    }

    @GetMapping("/{auctionId}")
    @Operation(summary = "입찰 내역 조회", description = "특정 경매의 입찰 내역을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = BidsResponseDto.class)))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "경매를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    public ResponseEntity<?> getBidding(@PathVariable Long auctionId) {

        List<BidsResponseDto> bids = bidsService.getAllBids(auctionId);

        return ResponseEntity.ok(bids);
    }
}
