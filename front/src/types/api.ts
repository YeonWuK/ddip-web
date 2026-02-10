// DB role enum: ADMIN | USER
export type UserRole = 'ADMIN' | 'USER';

// 공통 사용자 타입
export interface UserResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
  role?: UserRole; // ADMIN: 관리자, USER: 일반 사용자
  /** 포인트 잔액 (상단 바 등에 표시) */
  pointBalance?: number;
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

// 프로필 업데이트 관련 타입
export interface ProfileUpdateRequest {
  username?: string;  // 백엔드 DTO: username (이름)
  nickname?: string;  // 백엔드 DTO: nickname (닉네임)
  phoneNumber?: string;  // 백엔드 DTO: phoneNumber (전화번호)
  phone?: string;  // 하위 호환성을 위해 유지
  name?: string;  // 하위 호환성을 위해 유지
  profileImageUrl?: string | null;
}

// OAuth 관련 타입
export type OAuthProvider = 'google' | 'kakao' | 'naver'

export interface OAuthCallbackRequest {
  code: string;
  state?: string;
}

// 프로젝트 생성/수정 요청 타입 - 백엔드 ProjectRequestDto / ProjectUpdateRequestDto와 일치
export interface RewardTierRequest {
  title: string;
  description: string;
  price: number;
  limitQuantity: number | null; // null이면 무제한
}

export interface ProjectCreateRequest {
  title: string;
  description: string;
  targetAmount: number;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
  rewardTiers: RewardTierRequest[];
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  /** 삭제할 이미지 URL 목록 (X 버튼으로 제거한 기존 이미지들) */
  removedImageUrls?: string[];
}

// 프로젝트 상태 (백엔드 ProjectStatus enum)
export type ProjectStatus =
  | 'DRAFT'      // 오픈 전
  | 'OPEN'      // 열림 (진행 중)
  | 'SUCCESS'   // 펀딩 성공
  | 'FAILED'    // 실패
  | 'CANCELED'  // 유저 직접 취소
  | 'REJECTED'  // 어드민 거절
  | 'STOP';     // 어드민 일시정지

// 프로젝트 관련 타입
export interface RewardTierResponse {
  id: number;
  rewardTierId?: number; // 백엔드 RewardTierResponseDto 필드명
  title: string;
  description: string;
  price: number;
  limitQuantity: number | null;
  soldQuantity: number;
  soldOut?: boolean;
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
  status: ProjectStatus;
  startAt: string;
  endAt: string;
  rewardTiers: RewardTierResponse[];
  createdAt: string;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
  /** 참여자 수 (pledge 건수, 백엔드 제공 시) */
  backerCount?: number;
}

// 경매 상태 타입
export type AuctionStatus = 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED';
export type MyAuctionStatus = 'HIGHEST_BIDDER' | 'OUTBID' | 'ENDED_WON' | 'ENDED_LOST';

// 경매 생성 요청 타입
export interface AuctionCreateRequest {
  title: string;
  description: string;
  startPrice: number;
  bidStep: number;
  endAt: string; // ISO 8601 형식 (시작은 백엔드에서 생성 시점으로 자동 설정)
  thumbnailImageUrl?: string | null;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 경매 상세 응답 타입
export interface AuctionResponse {
  id: number;
  seller: UserResponse;
  title: string;
  description: string;
  thumbnailImageUrl: string | null;
  imageUrl: string | null; // 하위 호환성 유지 (첫 번째 이미지)
  imageUrls?: string[] | null; // 다중 이미지 (최대 3장)
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  buyoutPrice: number | null;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  winner: UserResponse | null;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
  bids?: BidSummary[]; // 입찰 내역 리스트
  createdAt?: string;
  updatedAt?: string;
}

// 경매 목록 요약 타입
export interface AuctionSummary {
  id: number;
  title: string;
  thumbnailImageUrl: string | null;
  /** 목록/카드용 메인 이미지 URL (S3 풀 URL, thumbnailImageUrl과 동일 소스) */
  imageUrl?: string | null;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  status: AuctionStatus;
  startAt: string;
  endAt: string;
  bidCount: number;
  categoryPath?: string | null;
  summary?: string | null;
}

// 후원 관련 타입 (하위 호환성 유지)
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

// 리워드 구매(Pledge) 관련 타입 - 백엔드 PledgeCreateRequestDto / PledgeResponseDto와 일치
export interface PledgeItemRequest {
  rewardTierId: number;
  quantity: number;
}

export interface PledgeCreateRequest {
  /** rewardTierId + quantity (items 없을 때 사용) */
  rewardTierId?: number;
  quantity?: number;
  /** 구매할 리워드 아이템 목록 (백엔드 필수) */
  items?: PledgeItemRequest[];
  donateAmount?: number;
}

export interface PledgeResponse {
  pledgeId: number;
  projectId: number;
  userId?: number;
  rewardTierId: number;
  amount: number;
  status?: string;
  createdAt: string;
  // 하위 호환성
  id?: number;
  projectTitle?: string;
  rewardTierTitle?: string;
  supporter?: UserResponse;
}

// 입찰 요청 타입
export interface BidRequest {
  price: number;
}

// 입찰 응답 타입
export interface BidResponse {
  bidId: number;
  auction: AuctionResponse;
  bidPrice: number;
  isHighestBidder: boolean;
}

// 입찰 요약 타입 (경매 상세 페이지용)
export interface BidSummary {
  id: number;
  bidder: UserResponse;
  bidderNickname: string;
  bidPrice: number;
  bidAt: string; // 입찰 시간
}

// 내 입찰 현황 타입 (마이페이지용)
export interface MyBidsSummary {
  auctionId: number;
  auctionTitle: string;
  auctionThumbnailUrl: string | null;
  auctionStatus: AuctionStatus;
  myAuctionStatus: MyAuctionStatus;
  lastBidPrice: number;
  currentPrice: number;
  isHighestBidder: boolean; // 현재 최고 입찰자인지 여부
  lastBidAt: string;
  auctionEndAt: string;
  isPaid: boolean;
}

// 마이페이지 응답 타입 (백엔드 UserPageResponseDto와 일치)
export interface UserPageResponse {
  user: UserResponse;
  auctions: AuctionSummary[]; // 내가 생성한 경매 목록
  myBids: BidResponse[]; // 내 입찰 응답 목록 (BidsResponseDto)
  myMyBids: MyBidsSummary[]; // 내 입찰 현황 목록 (MyBidsSummaryDto)
}

// 프로필 상세 응답 타입 (다른 사용자 프로필 보기용)
export interface UserProfileResponse {
  user: UserResponse;
  // 추가 정보가 필요하면 여기에 추가
}

// 배송지 관련 타입 - 백엔드 AddressCreateRequestDto / AddressResponseDto / AddressUpdateRequestDto와 일치
export interface AddressCreateRequest {
  label?: string; // 배송지 라벨 (선택, 최대 30자) - 집/회사 등
  recipientName: string; // 수령인 이름 (필수, 최대 100자)
  phone: string; // 전화번호 (필수, 최대 20자)
  zipCode: string; // 우편번호 (필수, 최대 10자)
  address: string; // 주소/도로명 (백엔드: address1, 필수, 최대 255자)
  detailAddress: string; // 상세주소 (백엔드: address2, 필수, 최대 255자)
  setAsDefault?: boolean; // 기본 배송지로 설정 여부 (생성 시)
}

export interface AddressUpdateRequest {
  label?: string;
  recipientName?: string;
  phone?: string;
  zipCode?: string;
  address?: string; // 백엔드: address1
  detailAddress?: string; // 백엔드: address2
}

export interface AddressResponse {
  id: number;
  label?: string | null; // 배송지 라벨 (집/회사 등)
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string; // 도로명/지번 주소 (백엔드: address1)
  detailAddress: string; // 상세주소 (백엔드: address2)
  isDefault: boolean;
}
