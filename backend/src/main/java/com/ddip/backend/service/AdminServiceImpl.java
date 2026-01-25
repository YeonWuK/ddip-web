package com.ddip.backend.service;

import com.ddip.backend.dto.admin.auction.AdminAuctionDetailDto;
import com.ddip.backend.dto.admin.auction.AdminAuctionSearchCondition;
import com.ddip.backend.dto.admin.auction.AdminAuctionSummaryDto;
import com.ddip.backend.dto.admin.auction.AdminBidSummaryDto;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectDetailDto;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSearchCondition;
import com.ddip.backend.dto.admin.crowdfunding.AdminProjectSummaryDto;
import com.ddip.backend.dto.admin.point.AdminPointHistoryRepDto;
import com.ddip.backend.dto.admin.user.AdminUserDetailDto;
import com.ddip.backend.dto.admin.user.AdminUserSearchCondition;
import com.ddip.backend.dto.admin.user.AdminUserSummaryDto;
import com.ddip.backend.dto.enums.AdminActionType;
import com.ddip.backend.dto.enums.AdminTargetType;
import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.entity.*;
import com.ddip.backend.repository.AdminHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserService userService;
    private final AuctionService auctionService;
    private final BidsService bidsService;
    private final CrowdFundingService crowdFundingService;
    private final PledgeService pledgeService;
    private final PointService pointService;
    private final SmsService smsService;
    private final TokenBlackListService tokenBlackListService;
    private final AdminHistoryRepository adminHistoryRepository;

    /**
     *   1. 유저 관리
     */
    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserSummaryDto> getUserList(AdminUserSearchCondition condition, Pageable pageable) {

        Page<User> users = userService.searchUsersForAdmin(condition, pageable);

        return users.map(AdminUserSummaryDto::from);

    }

    /**
     *   User 가 한 이벤트들에 대한 상세 조회
     */
    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailDto getUserDetail(Long userId) {

        User user = userService.getUser(userId);

        // 판매자로서 올린 경매들
        List<Auction> sellingAuctions = auctionService.getAuctionsBySeller(userId);

        // 입찰 기록 (Bids 기준)
        List<Bids> bids = bidsService.getBidsByUser(userId);

        // 펀딩 참여 기록
        List<Pledge> pledges = pledgeService.getPledgesByUser(userId);

        // 포인트 원장 이력
        List<PointLedger> ledgers = pointService.getLedgersByUser(userId);

        return AdminUserDetailDto.of(user, sellingAuctions, bids, pledges, ledgers);

    }

    @Override
    public void banUser(Long userId, String reason) {
        // 1. 유저 비활성화
//        userService.banUser(userId, reason);

        // 2. 토큰 블랙리스트 처리 → 강제 로그아웃
//        tokenBlackListService.blacklistTokensByUserId(userId, reason);

        // 3. 필요시 SMS 알림 등
        // String phone = userService.getUserById(userId).getPhoneNumber();
        // smsService.sendSms(phone, "[제재 안내] " + reason);
    }

    @Override
    public void unbanUser(Long userId) {
//        userService.unbanUser(userId);
    }

    @Override
    public void forceLogoutUser(Long userId, String reason) {
//        tokenBlackListService.blacklistTokensByUserId(userId, reason);
    }

    /**
     *   2. 경매 관리
     */

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAuctionSummaryDto> getAuctionList(AdminAuctionSearchCondition condition, Pageable pageable) {
        Page<Auction> auctions = auctionService.searchAuctionsForAdmin(condition, pageable);
        return auctions.map(AdminAuctionSummaryDto::from);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAuctionDetailDto getAuctionDetail(Long auctionId) {
        Auction auction = auctionService.getAuctionById(auctionId);

        // 입찰 로그
        List<Bids> bids = bidsService.getBidsByAuctionId(auctionId);
        List<AdminBidSummaryDto> bidDtos = bids.stream()
                .map(AdminBidSummaryDto::from)
                .toList();

        return AdminAuctionDetailDto.of(auction, bidDtos);
    }

    /**
     *  경매 강제 낙찰
     */
    @Override
    public void forceCloseAuction(Long auctionId, String reason) {
        Auction auction = auctionService.getAuctionById(auctionId);

        // 경매 강제 낙찰
        auctionService.forceEndAuction(auctionId);

        smsService.sendSms(auction.getTitle(), reason);
    }

    /**
     *  경매 강제 취소
     */
    @Override
    public void cancelAuction(Long auctionId, String reason) {
        Auction auction = auctionService.getAuctionById(auctionId);

        // 경매 강제 취소
        auctionService.cancelAuctionByAdmin(auctionId);

        smsService.sendSms(auction.getTitle(), reason);
    }

    /**
     *   3. 크라우드 펀딩 관리
     */

    /**
    *   Project 조회
    */
    @Override
    @Transactional(readOnly = true)
    public Page<AdminProjectSummaryDto> getProjectList(AdminProjectSearchCondition condition, Pageable pageable) {
        Page<Project> projects = crowdFundingService.searchProjectsForAdmin(condition, pageable);
        return projects.map(AdminProjectSummaryDto::from);
    }

    /**
     *   Project 상세 조회 (CrowdFunding - project, rewards, pledges)
     */
    @Override
    @Transactional(readOnly = true)
    public AdminProjectDetailDto getProjectDetail(Long projectId) {

        Project project = crowdFundingService.getProjectWithRewardTiersAndCreator(projectId);

        List<RewardTier> rewardTiers = project.getRewardTiers();

        List<Pledge> pledges = pledgeService.getPledgesByProject(projectId);

        return AdminProjectDetailDto.of(project, rewardTiers, pledges);

    }

    /**
     *   Project Open 승인
     */
    @Override
    public void approveProject(Long projectId, Long adminId) {
        Project project = crowdFundingService.getProjectEntity(projectId);
        project.openFunding();

        log.info("Approving project By Admin projectId = {}, adminId = {} ", projectId, adminId);

        AdminHistory adminHistory = AdminHistory.of(AdminTargetType.PROJECT, projectId, AdminActionType.PROJECT_APPROVE, adminId, "OPEN BY ADMIN");
        adminHistoryRepository.save(adminHistory);

        // 필요시 크리에이터에게 알림
        // String phone = project.getCreator().getPhoneNumber();
        // smsService.sendSms(phone, "[프로젝트 승인] " + project.getTitle());
    }

    /**
     *   Project 거절 + 사유
     */
    @Override
    public void rejectProject(Long projectId, String reason, Long adminId) {

        crowdFundingService.rejectProjectByAdmin(projectId);
        AdminHistory adminHistory = AdminHistory.of(AdminTargetType.PROJECT, projectId, AdminActionType.PROJECT_REJECT, adminId, reason);
        adminHistoryRepository.save(adminHistory);

        // 필요시 크리에이터에게 알림
        // String phone = project.getCreator().getPhoneNumber();
        // smsService.sendSms(phone, "[프로젝트 거절] " + reason);

    }

    /**
     *   Project 강제 정지 + 사유
     */
    @Override
    public void forceStopProject(Long projectId, String reason, Long adminId) {

        crowdFundingService.forceStopByAdmin(projectId);

        AdminHistory adminHistory = AdminHistory.of(AdminTargetType.PROJECT, projectId, AdminActionType.PROJECT_FORCE_STOP, adminId, reason);
        adminHistoryRepository.save(adminHistory);

    }

    /**
     *   Project 취소 + 사유
     */
    @Override
    public void forceCancelProject(Long projectId, String reason, Long adminId){

        crowdFundingService.forceCancelProjectByAdmin(projectId);

        AdminHistory adminHistory = AdminHistory.of(AdminTargetType.PROJECT, projectId, AdminActionType.PROJECT_FORCE_CANCEL, adminId, reason);
        adminHistoryRepository.save(adminHistory);

    }

    /**
     *   4. 포인트 관리 및 기타
     */

    /**
     * amount > 0 : 관리자에 의한 포인트 지급
     * amount < 0 : 관리자에 의한 포인트 차감
     */
    @Override
    public void adjustUserPoint(Long userId, long amount, String reason, Long adminId) {

        if (amount == 0L) {
            log.info("adjustUserPoint called with amount=0, skip. userId={}, adminId={}", userId, adminId);
            return;
        }

        PointLedgerType type = PointLedgerType.ADJUST;

        pointService.changePoint(userId, amount, type, PointLedgerSource.ADMIN, adminId,
                "관리자 조정(" + adminId + "): " + reason);

        AdminHistory history = AdminHistory.of(AdminTargetType.POINT, userId, AdminActionType.POINT_ADJUST, adminId, reason);

        adminHistoryRepository.save(history);

        log.info("관리자 포인트 조정 기록 저장 완료. adminId={}, userId={}, amount={}, reason={}", adminId, userId, amount, reason);

    }

    @Override
    public Page<AdminPointHistoryRepDto> getUserPointHistory(Long userId, Pageable pageable) {

        Page<PointLedger> ledgers = pointService.getLedgersByUser(userId, pageable);

        return ledgers.map(AdminPointHistoryRepDto::from);

    }

    @Override
    public void sendSmsToUser(Long userId, String message) {

        User user = userService.getUser(userId);

        String phoneNumber = user.getPhoneNumber();

        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.warn("sendSmsToUser failed: user has no phoneNumber. userId={}", userId);
            return;
        }

        smsService.sendSms(phoneNumber, message);
    }

    @Override
    public void sendSmsToPhone(String phoneNumber, String message) {
        smsService.sendSms(phoneNumber, message);
    }

}