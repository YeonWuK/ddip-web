package com.ddip.backend.admin.controller;

import com.ddip.backend.admin.dto.auction.AdminAuctionDetailDto;
import com.ddip.backend.admin.dto.auction.AdminAuctionSearchCondition;
import com.ddip.backend.admin.dto.auction.AdminAuctionSummaryDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectDetailDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.admin.dto.point.AdjustPointRequestDto;
import com.ddip.backend.admin.dto.point.AdminPointHistoryRepDto;
import com.ddip.backend.admin.dto.user.AdminSellerDetailDto;
import com.ddip.backend.admin.dto.user.AdminUserDetailDto;
import com.ddip.backend.admin.dto.user.AdminUserSearchCondition;
import com.ddip.backend.admin.dto.user.AdminUserSummaryDto;
import com.ddip.backend.admin.dto.user.SmsToPhoneRequestDto;
import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "관리자 API")
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
    @Operation(summary = "유저 목록 조회", description = "검색 조건과 페이징으로 유저 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음")
    })
    public Page<AdminUserSummaryDto> getUserList(AdminUserSearchCondition condition, Pageable pageable) {
        return adminService.getUserList(condition, pageable);
    }

    /**
     * 유저 상세 조회 (경매/펀딩/포인트 내역 포함)
     * GET /api/admin/users/{userId}
     */
    @GetMapping("/users/{userId}")
    @Operation(summary = "유저 상세 조회", description = "유저 기본 정보와 활동 내역을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    public AdminUserDetailDto getUserDetail(@PathVariable Long userId) {
        return adminService.getUserDetail(userId);
    }

    /**
     * 판매자 상세 조회 (등록 경매/프로젝트 포함)
     * GET /api/admin/sellers/{userId}
     */
    @GetMapping("/sellers/{userId}")
    @Operation(summary = "판매자 상세 조회", description = "판매자의 기본 정보와 등록한 경매/프로젝트 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    public AdminSellerDetailDto getSellerDetail(@PathVariable Long userId) {
        return adminService.getSellerDetail(userId);
    }

    /**
     * 유저 정지
     * POST /api/admin/users/{userId}/ban
     * body: { "reason": "사유" }
     */
    @PostMapping("/users/{userId}/ban")
    @Operation(summary = "유저 정지", description = "유저 계정을 정지 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "정지 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    public ResponseEntity<Void> banUser(@PathVariable Long userId, @RequestBody String reason) {
        adminService.banUser(userId, reason);
        return ResponseEntity.ok().build();
    }

    /**
     * 유저 정지 해제
     * POST /api/admin/users/{userId}/unban
     */
    @PostMapping("/users/{userId}/unban")
    @Operation(summary = "유저 정지 해제", description = "유저 계정 정지를 해제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "해제 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
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
    @Operation(summary = "유저 강제 로그아웃", description = "유저의 세션/토큰을 무효화합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "강제 로그아웃 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
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
    @Operation(summary = "경매 목록 조회", description = "검색 조건과 페이징으로 경매 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음")
    })
    public Page<AdminAuctionSummaryDto> getAuctionList(AdminAuctionSearchCondition condition, Pageable pageable) {
        return adminService.getAuctionList(condition, pageable);
    }

    /**
     * 경매 상세 조회
     * GET /api/admin/auctions/{auctionId}
     */
    @GetMapping("/auctions/{auctionId}")
    @Operation(summary = "경매 상세 조회", description = "특정 경매의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
    public AdminAuctionDetailDto getAuctionDetail(@PathVariable Long auctionId) {
        return adminService.getAuctionDetail(auctionId);
    }

    /**
     * 경매 강제 종료 (낙찰/정산 포함)
     * POST /api/admin/auctions/{auctionId}/force-close
     * body: { "reason": "사유" }
     */
    @PostMapping("/auctions/{auctionId}/force-close")
    @Operation(summary = "경매 강제 종료", description = "관리자가 경매를 강제로 종료합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "강제 종료 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
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
    @Operation(summary = "경매 취소", description = "관리자가 경매를 취소하고 환불 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "취소 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "경매를 찾을 수 없음")
    })
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
    @Operation(summary = "프로젝트 목록 조회", description = "검색 조건과 페이징으로 프로젝트 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음")
    })
    public Page<AdminProjectSummaryDto> getProjectList(AdminProjectSearchCondition condition, Pageable pageable) {
        return adminService.getProjectList(condition, pageable);
    }

    /**
     * 프로젝트 상세 조회 (프로젝트 + 리워드 + 후원 내역)
     * GET /api/admin/projects/{projectId}
     */
    @GetMapping("/projects/{projectId}")
    @Operation(summary = "프로젝트 상세 조회", description = "프로젝트, 리워드, 후원 내역을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
    public AdminProjectDetailDto getProjectDetail(@PathVariable Long projectId) {
        return adminService.getProjectDetail(projectId);
    }

    /**
     * 프로젝트 OPEN 승인
     * POST /api/admin/projects/{projectId}/approve
     */
    @PostMapping("/projects/{projectId}/approve")
    @Operation(summary = "프로젝트 승인", description = "프로젝트를 OPEN 상태로 승인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "승인 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
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
    @Operation(summary = "프로젝트 거절", description = "프로젝트를 거절 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "거절 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
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
    @Operation(summary = "프로젝트 강제 정지", description = "프로젝트를 강제로 중단 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "정지 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
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
    @Operation(summary = "프로젝트 강제 취소", description = "프로젝트를 강제로 취소하고 환불 처리합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "취소 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트를 찾을 수 없음")
    })
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
    @Operation(summary = "유저 포인트 조정", description = "관리자가 특정 유저의 포인트를 조정합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조정 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
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
    @Operation(summary = "유저 포인트 히스토리 조회", description = "특정 유저의 포인트 변경 이력을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    public Page<AdminPointHistoryRepDto> getUserPointHistory(@PathVariable Long userId, Pageable pageable) {
        return adminService.getUserPointHistory(userId, pageable);
    }

    /**
     * 특정 유저에게 SMS 전송
     * POST /api/admin/users/{userId}/sms
     * body: { "message": "내용" }
     */
    @PostMapping("/users/{userId}/sms")
    @Operation(summary = "유저 대상 SMS 전송", description = "특정 유저에게 SMS를 전송합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "전송 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
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
    @Operation(summary = "임의 번호 SMS 전송", description = "전화번호와 메시지를 받아 SMS를 전송합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "전송 성공"),
            @ApiResponse(responseCode = "403", description = "관리자 권한 없음"),
            @ApiResponse(responseCode = "400", description = "요청 값 오류")
    })
    public ResponseEntity<Void> sendSmsToPhone(@RequestBody SmsToPhoneRequestDto request) {
        adminService.sendSmsToPhone(request.getPhoneNumber(), request.getMessage());
        return ResponseEntity.ok().build();
    }

}
