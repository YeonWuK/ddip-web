//package com.ddip.backend.controller;
//
//import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
//import com.ddip.backend.dto.crowd.PledgeResponseDto;
//import com.ddip.backend.security.auth.CustomUserDetails;
//import com.ddip.backend.service.PledgeService;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.web.bind.annotation.*;
//
//@Slf4j
//@RestController
//@RequestMapping("/api/crowd")
//@RequiredArgsConstructor
//public class PledgeController {
//
//    private final PledgeService pledgeService;
//
//    /**
//     * 후원 생성
//     * POST /api/crowd/{projectId}/pledges
//     */
//    @PostMapping("/{projectId}/pledges")
//    public ResponseEntity<PledgeResponseDto> createPledge(@AuthenticationPrincipal CustomUserDetails userDetails,
//            @PathVariable Long projectId, @Valid @RequestBody PledgeCreateRequestDto requestDto) {
//        Long userId = userDetails.getUserId();
//        PledgeResponseDto response = pledgeService.createPledge(userId, projectId, requestDto);
//        return ResponseEntity.status(201).body(response);
//    }
//
//    /**
//     * 후원 단건 조회 (본인 것만)
//     * GET /api/crowd/pledges/{pledgeId}
//     */
//    @GetMapping("/pledges/{pledgeId}")
//    public ResponseEntity<PledgeResponseDto> getPledge(
//            @AuthenticationPrincipal CustomUserDetails userDetails,
//            @PathVariable Long pledgeId) {
//        Long userId = userDetails.getUserId();
//        PledgeResponseDto response = pledgeService.getPledge(userId, pledgeId);
//        return ResponseEntity.ok(response);
//    }
//
//    /**
//     * 후원 취소
//     * PATCH /api/crowd/pledges/{pledgeId}/cancel
//     */
//    @PatchMapping("/pledges/{pledgeId}/cancel")
//    public ResponseEntity<Void> cancelPledge(
//            @AuthenticationPrincipal CustomUserDetails userDetails,
//            @PathVariable Long pledgeId
//    ) {
//        Long userId = userDetails.getUserId();
//        pledgeService.cancelPledge(userId, pledgeId);
//        return ResponseEntity.ok().build();
//    }
//
//}
