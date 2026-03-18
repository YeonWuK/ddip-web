/**
 * 중앙 집중식 API 서비스 허브
 * 
 * 이 파일은 각 도메인별로 분리된 API 서비스들을 re-export하여
 * 기존 컴포넌트들의 import 경로가 깨지지 않도록 보장합니다.
 * 
 * 도메인별 서비스 파일:
 * - apiClient.ts: 기본 API 요청 클라이언트
 * - utils/imageUtils.ts: 이미지 URL 변환 유틸리티
 * - crowdService.ts: 크라우드펀딩 & 프로젝트 & 후원 관련
 * - auctionService.ts: 경매 & 입찰 관련
 * - userService.ts: 사용자 & 인증 & 배송지 관련
 * - adminService.ts: 관리자 전용 기능 관련
 * - searchService.ts: 통합 검색 엔진 관련
 */

// ==================== 타입 Re-export (중앙 타입 시스템) ====================
export type {
  // 검색 관련 타입
  SearchAutoCompleteResponse,
  ProjectSearchResponse,
  AuctionSearchResponse,
  // 프로젝트 관련 타입
  ProjectResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  // 경매 관련 타입
  AuctionResponse,
  AuctionSummary,
  AuctionCreateRequest,
  AuctionStatus,
  // 입찰 관련 타입
  BidRequest,
  BidResponse,
  BidSummary,
  MyBidsSummary,
  // 사용자 관련 타입
  UserResponse,
  UserPageResponse,
  LoginRequest,
  FindPasswordRequest,
  RegisterRequest,
  AuthResponse,
  // 후원 관련 타입
  SupportRequest,
  SupportResponse,
  // 배송지 관련 타입
  AddressResponse,
  AddressCreateRequest,
  AddressUpdateRequest,
  // 기타 공통 타입
  PageResponse,
} from '@/src/types/api';

// ==================== 기본 클라이언트 & 유틸리티 ====================
export { apiRequest, API_BASE_URL } from '@/src/services/apiClient';
export { toS3ImageUrl, getProjectImageUrls } from '@/src/services/utils/imageUtils';

// ==================== 도메인별 API 서비스 ====================

// 크라우드펀딩(Crowd) 도메인
export { projectApi } from '@/src/services/crowdService';

// 경매(Auction) & 입찰(Bidding) 도메인
export { auctionApi } from '@/src/services/auctionService';

// 사용자(User), 인증(Auth), 배송지(Address) 도메인
export { userApi, authApi, addressApi } from '@/src/services/userService';

// 관리자(Admin) 도메인
export { adminApi } from '@/src/services/adminService';

// 검색(Search) 도메인
export { searchApi } from '@/src/services/searchService';
