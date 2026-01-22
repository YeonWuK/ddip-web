package com.ddip.backend.controller;

import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
import com.ddip.backend.dto.crowd.PledgeResponseDto;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.PledgeService;
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
public class PledgeController {

    private final PledgeService pledgeService;

    /**
     * 리워드 구매
     * POST /api/crowd/pledges/{projectId}
     */
    @PostMapping("{projectId}")
    public ResponseEntity<PledgeResponseDto> createPledge(@AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long projectId, @Valid @RequestBody PledgeCreateRequestDto requestDto) {
        Long userId = userDetails.getUserId();
        PledgeResponseDto response = pledgeService.createPledge(userId, projectId, requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 리워드 전체 조회 (본인 것만)
     * GET /api/crowd/pledges/{pledgeId}
     */
    @GetMapping
    public ResponseEntity<List<PledgeResponseDto>> getMyPledges(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUserId();
        List<PledgeResponseDto> response = pledgeService.getAllPledge(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 리워드 취소
     * PATCH /api/crowd/pledges/{pledgeId}/cancel
     */
    @PatchMapping("/{pledgeId}/cancel")
    public ResponseEntity<Void> cancelPledge(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long pledgeId) {
        Long userId = userDetails.getUserId();
        pledgeService.cancelPledge(userId, pledgeId);
        return ResponseEntity.ok().build();
    }

}
