/**
 * Swagger 자동 생성 타입의 Alias 모음
 * 
 * 사용법:
 * - import type { AuctionResponse, BidResponse } from '@/src/types/api-aliases';
 * - 자동 생성된 타입을 더 간결한 이름으로 사용
 */

import type { components } from './api.generated';

// ==================== Schemas ====================
type Schemas = components['schemas'];

// ==================== 경매 관련 ====================
export type AuctionResponse = Schemas['AuctionResponseDto'];
export type AuctionDetailResponse = Schemas['AuctionDetailResponseDto'];
export type AuctionRequest = Schemas['AuctionRequestDto'];
// AuctionStatus는 inline enum으로 정의됨: "RUNNING" | "ENDED" | "CANCELED"
export type AuctionStatus = "RUNNING" | "ENDED" | "CANCELED";

// ==================== 입찰 관련 ====================
export type BidResponse = Schemas['BidsResponseDto'];
export type BidRequest = Schemas['BidsRequestDto'];

// ==================== 프로젝트 관련 ====================
export type ProjectResponse = Schemas['ProjectResponseDto'];
export type ProjectDetailResponse = Schemas['ProjectDetailResponseDto'];
export type ProjectRequest = Schemas['ProjectRequestDto'];
export type ProjectUpdateRequest = Schemas['ProjectUpdateRequestDto'];
export type RewardTierResponse = Schemas['RewardTierResponseDto'];
export type RewardTierRequest = Schemas['RewardTierRequestDto'];
// ProjectStatus는 inline enum: "DRAFT" | "OPEN" | "SUCCESS" | "FAILED" | "CANCELED" | "REJECTED" | "STOP"
export type ProjectStatus = "DRAFT" | "OPEN" | "SUCCESS" | "FAILED" | "CANCELED" | "REJECTED" | "STOP";

// ==================== 사용자 관련 ====================
export type UserResponse = Schemas['UserResponseDto'];
export type UserRequest = Schemas['UserRequestDto'];
export type UserUpdateRequest = Schemas['UserUpdateRequestDto'];
export type ProfileRequest = Schemas['ProfileRequestDto'];
export type FindPasswordRequest = Schemas['FindPasswordRequestDto'];

// ==================== 후원 관련 ====================
export type PledgeCreateResponse = Schemas['PledgeCreateResponseDto'];
export type PledgeCreateRequest = Schemas['PledgeCreateRequestDto'];
export type PledgeItem = Schemas['PledgeItemDto'];
export type PledgeItemResult = Schemas['PledgeItemResultDto'];

// ==================== 배송지 관련 ====================
export type AddressResponse = Schemas['AddressResponseDto'];
export type AddressCreateRequest = Schemas['AddressCreateRequestDto'];
export type AddressUpdateRequest = Schemas['AddressUpdateRequestDto'];

// ==================== 검색 관련 ====================
export type ProjectSearchResponse = Schemas['ProjectSearchResponse'];
export type AuctionSearchResponse = Schemas['AuctionSearchResponse'];
export type SearchAutoCompleteResponse = Schemas['SearchAutoCompleteResponse'];

// ==================== Admin 관련 ====================
export type AdminUserSummary = Schemas['AdminUserSummaryDto'];
export type AdminUserDetail = Schemas['AdminUserDetailDto'];
export type AdminProjectSummary = Schemas['AdminProjectSummaryDto'];
export type AdminProjectDetail = Schemas['AdminProjectDetailDto'];
export type AdminAuctionSummary = Schemas['AdminAuctionSummaryDto'];
export type AdminAuctionDetail = Schemas['AdminAuctionDetailDto'];
export type AdminBidSummary = Schemas['AdminBidSummaryDto'];
export type AdminPledgeSummary = Schemas['AdminPledgeSummaryDto'];
export type AdminPointHistoryRep = Schemas['AdminPointHistoryRepDto'];
export type AdminSellerDetail = Schemas['AdminSellerDetailDto'];
export type AdminRewardTierSummary = Schemas['AdminRewardTierSummaryDto'];
export type AdjustPointRequest = Schemas['AdjustPointRequestDto'];
export type SmsToPhoneRequest = Schemas['SmsToPhoneRequestDto'];

// ==================== 페이지네이션 ====================
export type PageAdminUserSummary = Schemas['PageAdminUserSummaryDto'];
export type PageAdminProjectSummary = Schemas['PageAdminProjectSummaryDto'];
export type PageAdminAuctionSummary = Schemas['PageAdminAuctionSummaryDto'];
export type PageAdminPointHistory = Schemas['PageAdminPointHistoryRepDto'];
export type PageProjectSearchResponse = Schemas['PageProjectSearchResponse'];

// 공통 페이지 타입
export type PageableObject = Schemas['PageableObject'];
export type SortObject = Schemas['SortObject'];

// ==================== 타입 유틸리티 ====================

/**
 * API 응답에서 데이터 추출
 */
export type ApiResponse<T extends keyof components['schemas']> = components['schemas'][T];

/**
 * API Operation 파라미터 추출
 */
export type OperationParams<T extends keyof components['schemas']> = 
  components['schemas'][T] extends { parameters?: infer P } ? P : never;
