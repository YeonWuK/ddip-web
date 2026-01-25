package com.ddip.backend.controller;

import com.ddip.backend.dto.admin.auction.AdminAuctionDetailDto;
import com.ddip.backend.dto.admin.auction.AdminAuctionSearchCondition;
import com.ddip.backend.dto.admin.auction.AdminAuctionSummaryDto;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectDetailDto;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.dto.admin.point.AdjustPointRequestDto;
import com.ddip.backend.dto.admin.point.AdminPointHistoryRepDto;
import com.ddip.backend.dto.admin.user.AdminUserDetailDto;
import com.ddip.backend.dto.admin.user.AdminUserSearchCondition;
import com.ddip.backend.dto.admin.user.AdminUserSummaryDto;
import com.ddip.backend.dto.admin.user.SmsToPhoneRequestDto;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ==========================
    // 1. 유저 관리
    // ==========================

    /**
     * 유저 목록 조회 (검색 + 페이징)
     * GET /api/admin/users?email=...&username=...&role=...&active=true
     */
    @GetMapping("/users")
    public Page<AdminUserSummaryDto> getUserList(AdminUserSearchCondition condition, Pageable pageable) {
        return adminService.getUserList(condition, pageable);
    }

    /**
     * 유저 상세 조회 (경매/펀딩/포인트 내역 포함)
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public AdminUserDetailDto getUserDetail(@PathVariable Long userId) {
        return adminService.getUserDetail(userId);
    }

    /**
     * 유저 정지
     * POST /api/admin/users/{userId}/ban
     * body: { "reason": "사유" }
     */
    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<Void> banUser(@PathVariable Long userId, @RequestBody String reason) {
        adminService.banUser(userId, reason);
        return ResponseEntity.ok().build();
    }

    /**
     * 유저 정지 해제
     * POST /api/admin/users/{userId}/unban
     */
    @PostMapping("/users/{userId}/unban")
    public ResponseEntity<Void> unbanUser(@PathVariable Long userId) {
        adminService.unbanUser(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 유저 강제 로그아웃
     * POST /api/admin/users/{userId}/force-logout
     * body: { "reason": "사유" }
     */
    @PostMapping("/users/{userId}/force-logout")
    public ResponseEntity<Void> forceLogoutUser(@PathVariable Long userId, @RequestBody String reason) {
        adminService.forceLogoutUser(userId, reason);
        return ResponseEntity.ok().build();
    }

    // ==========================
    // 2. 경매 관리
    // ==========================

    /**
     * 경매 리스트 조회 (검색 + 페이징)
     * GET /api/admin/auctions?status=...&sellerEmail=...
     */
    @GetMapping("/auctions")
    public Page<AdminAuctionSummaryDto> getAuctionList(AdminAuctionSearchCondition condition, Pageable pageable) {
        return adminService.getAuctionList(condition, pageable);
    }

    /**
     * 경매 상세 조회
     * GET /api/admin/auctions/{auctionId}
     */
    @GetMapping("/auctions/{auctionId}")
    public AdminAuctionDetailDto getAuctionDetail(@PathVariable Long auctionId) {
        return adminService.getAuctionDetail(auctionId);
    }

    /**
     * 경매 강제 종료 (낙찰/정산 포함)
     * POST /api/admin/auctions/{auctionId}/force-close
     * body: { "reason": "사유" }
     */
    @PostMapping("/auctions/{auctionId}/force-close")
    public ResponseEntity<Void> forceCloseAuction(@PathVariable Long auctionId, @RequestBody String reason) {
        adminService.forceCloseAuction(auctionId, reason);
        return ResponseEntity.ok().build();
    }

    /**
     * 경매 취소 (입찰 포인트 환불)
     * POST /api/admin/auctions/{auctionId}/cancel
     * body: { "reason": "사유" }
     */
    @PostMapping("/auctions/{auctionId}/cancel")
    public ResponseEntity<Void> cancelAuction(@PathVariable Long auctionId, @RequestBody String reason) {
        adminService.cancelAuction(auctionId, reason);
        return ResponseEntity.ok().build();
    }

    // ==========================
    // 3. 크라우드 펀딩 관리
    // ==========================

    /**
     * 프로젝트 목록 조회
     * GET /api/admin/projects?title=...&status=OPEN...
     */
    @GetMapping("/projects")
    public Page<AdminProjectSummaryDto> getProjectList(AdminProjectSearchCondition condition, Pageable pageable) {
        return adminService.getProjectList(condition, pageable);
    }

    /**
     * 프로젝트 상세 조회 (프로젝트 + 리워드 + 후원 내역)
     * GET /api/admin/projects/{projectId}
     */
    @GetMapping("/projects/{projectId}")
    public AdminProjectDetailDto getProjectDetail(@PathVariable Long projectId) {
        return adminService.getProjectDetail(projectId);
    }

    /**
     * 프로젝트 OPEN 승인
     * POST /api/admin/projects/{projectId}/approve
     */
    @PostMapping("/projects/{projectId}/approve")
    public ResponseEntity<Void> approveProject(@PathVariable Long projectId, @AuthenticationPrincipal CustomUserDetails admin) {
        Long adminId = admin.getUserId();
        adminService.approveProject(projectId, adminId);
        return ResponseEntity.ok().build();
    }

    /**
     * 프로젝트 거절
     * POST /api/admin/projects/{projectId}/reject
     * body: { "reason": "사유" }
     */
    @PostMapping("/projects/{projectId}/reject")
    public ResponseEntity<Void> rejectProject(@PathVariable Long projectId, @RequestBody String reason,
                                              @AuthenticationPrincipal CustomUserDetails admin) {
        Long adminId = admin.getUserId();
        adminService.rejectProject(projectId, reason, adminId);
        return ResponseEntity.ok().build();
    }

    /**
     * 프로젝트 강제 정지
     * POST /api/admin/projects/{projectId}/force-stop
     * body: { "reason": "사유" }
     */
    @PostMapping("/projects/{projectId}/force-stop")
    public ResponseEntity<Void> forceStopProject(@PathVariable Long projectId, @RequestBody String reason,
                                                 @AuthenticationPrincipal CustomUserDetails admin) {
        Long adminId = admin.getUserId();
        adminService.forceStopProject(projectId, reason, adminId);
        return ResponseEntity.ok().build();
    }

    /**
     * 프로젝트 강제 취소 (환불 포함)
     * POST /api/admin/projects/{projectId}/force-cancel
     * body: { "reason": "사유" }
     */
    @PostMapping("/projects/{projectId}/force-cancel")
    public ResponseEntity<Void> forceCancelProject(@PathVariable Long projectId, @RequestBody String reason,
                                                   @AuthenticationPrincipal CustomUserDetails admin) {
        Long adminId = admin.getUserId();
        adminService.forceCancelProject(projectId, reason, adminId);
        return ResponseEntity.ok().build();
    }

    // ==========================
    // 4. 포인트 / SMS 관리
    // ==========================

    /**
     * 관리자 포인트 조정
     * POST /api/admin/points/adjust
     * body: { "userId": 1, "amount": 10000, "reason": "이벤트 지급" }
     */
    @PostMapping("/points/adjust")
    public ResponseEntity<Void> adjustUserPoint(@RequestBody AdjustPointRequestDto request,
                                                @AuthenticationPrincipal CustomUserDetails admin) {
        Long adminId = admin.getUserId();
        adminService.adjustUserPoint(request.getUserId(), request.getAdjustPoint(), request.getReason(), adminId);
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 유저 포인트 히스토리
     * GET /api/admin/users/{userId}/points?page=0&size=20
     */
    @GetMapping("/users/{userId}/points")
    public Page<AdminPointHistoryRepDto> getUserPointHistory(@PathVariable Long userId, Pageable pageable) {
        return adminService.getUserPointHistory(userId, pageable);
    }

    /**
     * 특정 유저에게 SMS 전송
     * POST /api/admin/users/{userId}/sms
     * body: { "message": "내용" }
     */
    @PostMapping("/users/{userId}/sms")
    public ResponseEntity<Void> sendSmsToUser(@PathVariable Long userId, @RequestBody String message) {
        adminService.sendSmsToUser(userId, message);
        return ResponseEntity.ok().build();
    }

    /**
     * 임의 전화번호로 SMS 전송
     * POST /api/admin/sms
     * body: { "phoneNumber": "010...", "message": "내용" }
     */
    @PostMapping("/sms")
    public ResponseEntity<Void> sendSmsToPhone(@RequestBody SmsToPhoneRequestDto request) {
        adminService.sendSmsToPhone(request.getPhoneNumber(), request.getMessage());
        return ResponseEntity.ok().build();
    }

}