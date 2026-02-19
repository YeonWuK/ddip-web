package com.ddip.backend.auction.controller;

import com.ddip.backend.auction.dto.auction.AuctionDetailResponseDto;
import com.ddip.backend.auction.dto.auction.AuctionRequestDto;
import com.ddip.backend.auction.dto.auction.AuctionResponseDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.auction.service.AuctionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auction")
@Tag(name = "Auction", description = "경매 API")
public class AuctionController {

    private final AuctionService auctionService;

    /**
     * 경매 생성
     */
    @PostMapping(consumes = {"multipart/form-data"})
    @Operation(summary = "경매 생성", description = "이미지와 경매 정보를 업로드하여 경매를 생성합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
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
    @Operation(summary = "경매 목록 조회", description = "등록된 경매 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    public ResponseEntity<List<AuctionResponseDto>> getAllAuctions() {
        List<AuctionResponseDto> auctionList = auctionService.getAllAuctions();
        return ResponseEntity.ok(auctionList);
    }

    /**
     * 경매 상세 조회
     */
    @GetMapping("/{auctionId}")
    @Operation(summary = "경매 상세 조회", description = "특정 경매의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
    public ResponseEntity<AuctionDetailResponseDto> getAuction(@PathVariable Long auctionId) {
        AuctionDetailResponseDto auction = auctionService.getAuction(auctionId);

        return ResponseEntity.ok(auction);
    }

    /**
     * 경매 삭제
     */
    @DeleteMapping("/{auctionId}")
    @Operation(summary = "경매 삭제", description = "본인이 등록한 경매를 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "삭제 권한 없음"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
    public ResponseEntity<?> deleteAuction(@AuthenticationPrincipal CustomUserDetails customUserDetails,
                                           @PathVariable Long auctionId) {

        auctionService.deleteAuction(auctionId, customUserDetails.getUserId());

        return ResponseEntity.ok("Deleted auction Successfully" + auctionId);
    }
}
