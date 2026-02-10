package com.ddip.backend.admin.service;

import com.ddip.backend.admin.dto.auction.AdminAuctionDetailDto;
import com.ddip.backend.admin.dto.auction.AdminAuctionSearchCondition;
import com.ddip.backend.admin.dto.auction.AdminAuctionSummaryDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectDetailDto;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.admin.dto.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.admin.dto.point.AdminPointHistoryRepDto;
import com.ddip.backend.admin.dto.user.AdminUserDetailDto;
import com.ddip.backend.admin.dto.user.AdminUserSearchCondition;
import com.ddip.backend.admin.dto.user.AdminUserSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    // ===== 1. 유저 관리 =====
    Page<AdminUserSummaryDto> getUserList(AdminUserSearchCondition condition, Pageable pageable);

    AdminUserDetailDto getUserDetail(Long userId);

    void banUser(Long userId, String reason);

    void unbanUser(Long userId);

    void forceLogoutUser(Long userId, String reason);


    // ===== 2. 경매 관리 =====
    Page<AdminAuctionSummaryDto> getAuctionList(AdminAuctionSearchCondition condition, Pageable pageable);

    AdminAuctionDetailDto getAuctionDetail(Long auctionId);

    void forceCloseAuction(Long auctionId, String reason);

    void cancelAuction(Long auctionId, String reason);

    // ===== 3. 크라우드펀딩 관리 =====
    Page<AdminProjectSummaryDto> getProjectList(AdminProjectSearchCondition condition, Pageable pageable);

    AdminProjectDetailDto getProjectDetail(Long projectId);

    void approveProject(Long projectId, Long adminId);

    void rejectProject(Long projectId, String reason, Long adminId);

    void forceStopProject(Long projectId, String reason, Long adminId);

    void forceCancelProject(Long projectId, String reason, Long adminId);


    // ===== 4. 포인트/정산 + 기타 =====
    void adjustUserPoint(Long userId, long amount, String reason, Long adminId);

    Page<AdminPointHistoryRepDto> getUserPointHistory(Long userId, Pageable pageable);

    void sendSmsToUser(Long userId, String message);

    void sendSmsToPhone(String phoneNumber, String message);

}