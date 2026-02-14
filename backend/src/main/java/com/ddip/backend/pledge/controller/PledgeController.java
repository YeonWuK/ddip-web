package com.ddip.backend.pledge.controller;

import com.ddip.backend.pledge.dto.PledgeCreateResponseDto;
import com.ddip.backend.pledge.dto.PledgeCreateRequestDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.pledge.service.PledgeQueryService;
import com.ddip.backend.pledge.service.PledgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/crowd/pledges")
@RequiredArgsConstructor
@Tag(name = "Pledge", description = "후원/리워드 API")
public class PledgeController {

    private final PledgeService pledgeService;
    private final PledgeQueryService pledgeQueryService;

    /**
     * 리워드 구매
     * POST /api/crowd/pledges/{projectId}
     */
    @PostMapping("{projectId}")
    @Operation(summary = "후원 생성", description = "프로젝트에 리워드를 선택해 후원합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "후원 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
    public ResponseEntity<PledgeCreateResponseDto> createPledge(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                                      @PathVariable Long projectId, @Valid @RequestBody PledgeCreateRequestDto requestDto) {
        Long userId = userDetails.getUserId();
        PledgeCreateResponseDto response = pledgeService.createPledge(userId, projectId, requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 리워드 전체 조회 (본인 것만)
     * GET /api/crowd/pledges/{pledgeId}
     */
    @GetMapping
    @Operation(summary = "내 후원 목록 조회", description = "내 후원 내역 전체를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    public ResponseEntity<List<PledgeCreateResponseDto>> getMyPledges(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUserId();
        List<PledgeCreateResponseDto> response = pledgeQueryService.getPledgeHistory(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 리워드 취소
     * PATCH /api/crowd/pledges/{pledgeId}/cancel
     */
    @PatchMapping("/{pledgeId}/cancel")
    @Operation(summary = "후원 취소", description = "내 후원을 취소합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "취소 성공"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "취소 권한 없음"),
            @ApiResponse(responseCode = "404", description = "후원을 찾을 수 없음")
    })
    public ResponseEntity<Void> cancelPledge(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long pledgeId) {
        Long userId = userDetails.getUserId();
        pledgeService.cancelPledge(userId, pledgeId);
        return ResponseEntity.ok().build();
    }

}
