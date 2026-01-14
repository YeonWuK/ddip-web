// 권한 레벨 상수
export const USER_ROLE_LEVEL = {
  USER: 0,           // 일반 사용자
  MODERATOR: 50,     // 중간 관리자
  ADMIN: 100,        // 최고 관리자
} as const

export type UserRoleLevel = typeof USER_ROLE_LEVEL[keyof typeof USER_ROLE_LEVEL]

// 공통 사용자 타입
export interface UserResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
  roleLevel?: number; // 권한 레벨 (0: 일반 사용자, 50: 중간 관리자, 100: 최고 관리자)
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 은행 타입 enum (백엔드 BankType과 일치)
export type BankType = 'KB' | 'SHINHAN' | 'WOORI' | 'HANA' | 'NH' | 'IBK' | 'KAKAO' | 'TOSS' | null;

export interface RegisterRequest {
  email: string;
  password: string;
  username: string; // 백엔드의 username (프론트엔드에서는 name으로 표시)
  nickname: string;
  phoneNumber: string; // 백엔드의 phoneNumber (nullable = false이므로 필수)
  account?: string | null; // 선택사항
  accountHolder?: string | null; // 선택사항
  bankType?: BankType; // 선택사항
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}

// OAuth 관련 타입
export type OAuthProvider = 'google' | 'kakao' | 'naver'

export interface OAuthCallbackRequest {
  code: string;
  state?: string;
}

// 프로젝트 관련 타입
export interface RewardTierResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  limitQuantity: number | null;
  soldQuantity: number;
}

export interface ProjectResponse {
  id: number;
  creator: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null; // 하위 호환성 유지 (첫 번째 이미지)
  imageUrls?: string[] | null; // 다중 이미지 (최대 3장)
  targetAmount: number;
  currentAmount: number;
  status: 'DRAFT' | 'OPEN' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  startAt: string;
  endAt: string;
  rewardTiers: RewardTierResponse[];
  createdAt: string;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 경매 관련 타입
export interface AuctionResponse {
  id: number;
  seller: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null; // 하위 호환성 유지 (첫 번째 이미지)
  imageUrls?: string[] | null; // 다중 이미지 (최대 3장)
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  buyoutPrice: number | null;
  status: 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED';
  startAt: string;
  endAt: string;
  winner: UserResponse | null;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 후원 관련 타입
export interface SupportRequest {
  projectId: number;
  rewardTierId: number;
  amount: number;
}

export interface SupportResponse {
  id: number;
  projectId: number;
  projectTitle: string;
  rewardTierId: number;
  rewardTierTitle: string;
  amount: number;
  supporter: UserResponse;
  createdAt: string;
}

// 입찰 관련 타입
export interface BidResponse {
  id: number;
  auctionId: number;
  auctionTitle: string;
  amount: number;
  bidder: UserResponse;
  createdAt: string;
}
