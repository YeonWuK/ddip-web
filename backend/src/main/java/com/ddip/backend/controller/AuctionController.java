package com.ddip.backend.controller;

import com.ddip.backend.dto.auction.AuctionRequestDto;
import com.ddip.backend.dto.auction.AuctionResponseDto;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.AuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auction")
public class AuctionController {

    private final AuctionService auctionService;

    /**
     * 경매 생성
     */
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createAuction(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @RequestPart(name = "file") List<MultipartFile> auctionFiles,
                                           @RequestPart(value = "data") AuctionRequestDto dto) {

        Long userId = customUserDetails.getUserId();

        AuctionResponseDto auctionResponseDto = auctionService.createAuction(auctionFiles, userId, dto);

        return ResponseEntity.ok(auctionResponseDto);
    }

    /**
     * 경매 전체 조회
     */
    @GetMapping
    public ResponseEntity<List<AuctionResponseDto>> getAllAuctions() {
        List<AuctionResponseDto> auctionList = auctionService.getAllAuctions();
        return ResponseEntity.ok(auctionList);
    }

    /**
     * 경매 상세 조회
     */
    @GetMapping("/{auctionId}")
    public ResponseEntity<AuctionResponseDto> getAuction(@PathVariable Long auctionId) {
        AuctionResponseDto auction = auctionService.getAuction(auctionId);

        return ResponseEntity.ok(auction);
    }

    /**
     * 경매 삭제
     */
    @DeleteMapping("/{auctionId}")
    public ResponseEntity<?> deleteAuction(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @PathVariable Long auctionId) {

        auctionService.deleteAuction(auctionId, customUserDetails.getUserId());

        return ResponseEntity.ok("Deleted auction Successfully" + auctionId);
    }
}
