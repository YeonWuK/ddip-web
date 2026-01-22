package com.ddip.backend.controller;

import com.ddip.backend.dto.bids.BidsRequestDto;
import com.ddip.backend.dto.bids.BidsResponseDto;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.BidsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bid")
public class BiddingController {

    private final BidsService bidsService;

    /**
     * 경매 참여
     */
    @PostMapping("/{auctionId}")
    public ResponseEntity<?> createBidding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @PathVariable Long auctionId, @RequestBody BidsRequestDto dto) {

        BidsResponseDto bidsResponseDto = bidsService.createBid(customUserDetails.getUserId(), auctionId, dto);

        return ResponseEntity.ok(bidsResponseDto);
    }

//    /**
//     * 입찰 결제 취소
//     */
//    @PostMapping("/cancel/{auctionId}")
//    public ResponseEntity<?> cancelBidding(@AuthenticationPrincipal CustomUserDetails customUserDetails,
//                                           @PathVariable Long auctionId) {
//
//    }
}
