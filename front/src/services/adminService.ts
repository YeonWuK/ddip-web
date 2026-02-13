/**
 * 관리자(Admin) 도메인 서비스
 * 유저 관리, 프로젝트 관리, 경매 관리, 포인트 조정 등 관리자 전용 기능
 */

import {
  AdminUserSearchCondition,
  AdminUserSummaryDto,
  AdminUserDetailDto,
  AdminPointHistoryDto,
  AdminProjectSearchCondition,
  AdminProjectSummaryDto,
  AdminProjectDetailDto,
  AdminAuctionSearchCondition,
  AdminAuctionSummaryDto,
  AdminAuctionDetailDto,
  PageResponse,
  AdjustPointRequestDto,
  SmsToPhoneRequestDto,
} from '@/src/types/api';
import { apiRequest } from '@/src/services/apiClient';

/**
 * 관리자 전용 API
 */
export const adminApi = {
  // ===== 유저 관리 =====
  
  /**
   * 유저 목록 조회 (검색/페이징)
   * GET /api/admin/users
   */
  getUserList: async (
    condition?: AdminUserSearchCondition,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AdminUserSummaryDto>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    if (condition) {
      if (condition.email) params.set('condition.email', condition.email);
      if (condition.username) params.set('condition.username', condition.username);
      if (condition.nickname) params.set('condition.nickname', condition.nickname);
      if (condition.phoneNumber) params.set('condition.phoneNumber', condition.phoneNumber);
      if (condition.role) params.set('condition.role', condition.role);
      if (condition.active !== undefined) params.set('condition.active', condition.active.toString());
    }
    
    return apiRequest<PageResponse<AdminUserSummaryDto>>(`/api/admin/users?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 유저 상세 조회
   * GET /api/admin/users/{userId}
   */
  getUserDetail: async (userId: number): Promise<AdminUserDetailDto> => {
    return apiRequest<AdminUserDetailDto>(`/api/admin/users/${userId}`, { method: 'GET' });
  },

  /**
   * 유저 포인트 히스토리 조회
   * GET /api/admin/users/{userId}/points
   */
  getUserPointHistory: async (
    userId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AdminPointHistoryDto>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    return apiRequest<PageResponse<AdminPointHistoryDto>>(
      `/api/admin/users/${userId}/points?${params.toString()}`,
      { method: 'GET' }
    );
  },

  /**
   * 유저 강제 로그아웃
   * POST /api/admin/users/{userId}/force-logout
   */
  forceLogoutUser: async (userId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/users/${userId}/force-logout`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  /**
   * 유저에게 SMS 전송
   * POST /api/admin/users/{userId}/sms
   */
  sendSmsToUser: async (userId: number, message: string): Promise<void> => {
    await apiRequest(`/api/admin/users/${userId}/sms`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  /**
   * 임의 번호로 SMS 전송
   * POST /api/admin/sms
   */
  sendSmsToPhone: async (data: SmsToPhoneRequestDto): Promise<void> => {
    await apiRequest('/api/admin/sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 유저 포인트 조정
   * POST /api/admin/points/adjust
   */
  adjustUserPoint: async (data: AdjustPointRequestDto): Promise<void> => {
    await apiRequest('/api/admin/points/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ===== 프로젝트 관리 =====

  /**
   * 프로젝트 목록 조회 (검색/페이징)
   * GET /api/admin/projects
   */
  getProjectList: async (
    condition?: AdminProjectSearchCondition,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AdminProjectSummaryDto>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    if (condition) {
      if (condition.title) params.set('condition.title', condition.title);
      if (condition.creatorEmail) params.set('condition.creatorEmail', condition.creatorEmail);
      if (condition.creatorUsername) params.set('condition.creatorUsername', condition.creatorUsername);
      if (condition.status) params.set('condition.status', condition.status);
      if (condition.categoryPath) params.set('condition.categoryPath', condition.categoryPath);
      if (condition.startFrom) params.set('condition.startFrom', condition.startFrom);
      if (condition.startTo) params.set('condition.startTo', condition.startTo);
    }
    
    return apiRequest<PageResponse<AdminProjectSummaryDto>>(`/api/admin/projects?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 프로젝트 상세 조회 (리워드/후원 내역 포함)
   * GET /api/admin/projects/{projectId}
   */
  getProjectDetail: async (projectId: number): Promise<AdminProjectDetailDto> => {
    return apiRequest<AdminProjectDetailDto>(`/api/admin/projects/${projectId}`, { method: 'GET' });
  },

  /**
   * 프로젝트 승인 (DRAFT → OPEN)
   * POST /api/admin/projects/{projectId}/approve
   */
  approveProject: async (projectId: number): Promise<void> => {
    await apiRequest(`/api/admin/projects/${projectId}/approve`, { method: 'POST' });
  },

  /**
   * 프로젝트 거절 (DRAFT → REJECTED)
   * POST /api/admin/projects/{projectId}/reject
   */
  rejectProject: async (projectId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/projects/${projectId}/reject`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  /**
   * 프로젝트 강제 정지
   * POST /api/admin/projects/{projectId}/force-stop
   */
  forceStopProject: async (projectId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/projects/${projectId}/force-stop`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  /**
   * 프로젝트 강제 취소 (환불 처리)
   * POST /api/admin/projects/{projectId}/force-cancel
   */
  forceCancelProject: async (projectId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/projects/${projectId}/force-cancel`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  // ===== 경매 관리 =====

  /**
   * 경매 목록 조회 (검색/페이징)
   * GET /api/admin/auctions
   */
  getAuctionList: async (
    condition?: AdminAuctionSearchCondition,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<AdminAuctionSummaryDto>> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    if (condition) {
      if (condition.title) params.set('condition.title', condition.title);
      if (condition.sellerUsername) params.set('condition.sellerUsername', condition.sellerUsername);
      if (condition.status) params.set('condition.status', condition.status);
      if (condition.startFrom) params.set('condition.startFrom', condition.startFrom);
      if (condition.startTo) params.set('condition.startTo', condition.startTo);
    }
    
    return apiRequest<PageResponse<AdminAuctionSummaryDto>>(`/api/admin/auctions?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * 경매 상세 조회
   * GET /api/admin/auctions/{auctionId}
   */
  getAuctionDetail: async (auctionId: number): Promise<AdminAuctionDetailDto> => {
    return apiRequest<AdminAuctionDetailDto>(`/api/admin/auctions/${auctionId}`, { method: 'GET' });
  },

  /**
   * 경매 강제 종료
   * POST /api/admin/auctions/{auctionId}/force-close
   */
  forceCloseAuction: async (auctionId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/auctions/${auctionId}/force-close`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  /**
   * 경매 취소 (환불 처리)
   * POST /api/admin/auctions/{auctionId}/cancel
   */
  cancelAuction: async (auctionId: number, reason: string): Promise<void> => {
    await apiRequest(`/api/admin/auctions/${auctionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },
};
