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
  /** 새로 업로드하는 file 배열 중 대표 이미지 인덱스 (0부터 시작) */
  mainIndex?: number;
}

export interface ProjectUpdateRequest extends Partial<ProjectCreateRequest> {
  /** 삭제할 이미지 ID 목록 (X 버튼으로 제거한 기존 이미지들, ProjectUpdateRequestDto.imageIds) */
  imageIds?: number[];
  /** 삭제할 기존 이미지의 ID 배열 */
  deleteImageIds?: number[];
  /** 기존 이미지 중 대표 이미지로 지정할 이미지 ID */
  mainImageId?: number;
  /** 새로 업로드하는 file 배열 중 대표 이미지 인덱스 (0부터 시작) */
  mainIndex?: number;
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
  creatorId?: number; // 백엔드에서 creatorId를 별도로 제공하는 경우 대비
  creator: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null; // 하위 호환성 유지 (첫 번째 이미지)
  imageUrls?: string[] | null; // 다중 이미지 (최대 3장)
  /** 기존 이미지 id+url (Edit 시 X 버튼으로 제거할 이미지 id 추적용) */
  imageItems?: { id: number; url: string }[];
  /** 대표 이미지로 지정된 기존 이미지 ID (Edit 시 초기 선택용) */
  mainImageId?: number;
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
  /** 달성률 (0~100, 백엔드 ProjectDetailResponseDto.achievementRate) */
  achievementRate?: number;
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
  /** 새로 업로드하는 file 배열 중 대표 이미지 인덱스 (0부터 시작) */
  mainIndex?: number;
  thumbnailImageUrl?: string | null;
  categoryPath?: string | null;
  tags?: string | null;
  summary?: string | null;
}

// 경매 수정 요청 타입 (project와 동일 방식)
export interface AuctionUpdateRequest extends Partial<AuctionCreateRequest> {
  /** 삭제할 기존 이미지의 ID 배열 */
  deleteImageIds?: number[];
  /** 기존 이미지 중 대표 이미지로 지정할 이미지 ID */
  mainImageId?: number;
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
  /** 기존 이미지 id+url (Edit 시 X 버튼으로 제거할 이미지 id 추적용) */
  imageItems?: { id: number; url: string }[];
  /** 대표 이미지 ID (Edit 시 대표 이미지 선택용) */
  mainImageId?: number;
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
  myBids: BidResponse[]; // 백엔드 bids → 미사용(프로필은 myMyBids 사용)
  myMyBids: MyBidsSummary[]; // 내 입찰 현황 (백엔드 myBids → 입찰 내역 탭)
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

// ==================== 관리자 API 타입 ====================

// 유저 검색 조건
export interface AdminUserSearchCondition {
  email?: string;
  username?: string;
  nickname?: string;
  phoneNumber?: string;
  role?: 'USER' | 'ADMIN';
  active?: boolean;
}

// 유저 요약 정보 (목록용)
export interface AdminUserSummaryDto {
  id: number;
  email: string;
  username: string;
  nickname: string;
  phoneNumber: string;
  provider?: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  pointBalance: number;
  createdAt: string;
}

// 입찰 요약 (관리자용)
export interface AdminBidSummaryDto {
  bidId: number;
  userId: number;
  username: string;
  auctionId: number;
  price: number;
  createdAt: string;
}

// 후원 요약 (관리자용)
export interface AdminPledgeSummaryDto {
  pledgeId: number;
  orderId: string;
  projectId: number;
  rewardTierId: number;
  paidAmount: number;
  quantity: number;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'CANCELED';
  createdAt: string;
}

// 포인트 히스토리
export interface AdminPointHistoryDto {
  id: number;
  userId: number;
  username: string;
  nickname: string;
  changeAmount: number;
  balanceAfter: number;
  type: string;
  source: string;
  referenceId?: number;
  description?: string;
  createdAt: string;
}

// 유저 상세 정보
export interface AdminUserDetailDto {
  user: AdminUserSummaryDto;
  bids: AdminBidSummaryDto[];
  pledges: AdminPledgeSummaryDto[];
  pointHistories: AdminPointHistoryDto[];
}

// 프로젝트 검색 조건
export interface AdminProjectSearchCondition {
  title?: string;
  creatorEmail?: string;
  creatorUsername?: string;
  status?: ProjectStatus;
  categoryPath?: string;
  startFrom?: string;
  startTo?: string;
}

// 프로젝트 요약 (관리자용)
export interface AdminProjectSummaryDto {
  id: number;
  creatorId: number;
  creatorUsername: string;
  creatorNickname: string;
  title: string;
  summary?: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatus;
  startAt: string;
  endAt: string;
  thumbnailUrl?: string;
  categoryPath?: string;
  tags?: string;
  likeCount: number;
  totalPledgeCount: number;
  achievementRate: number;
  createdAt: string;
}

// 리워드 티어 요약 (관리자용)
export interface AdminRewardTierSummaryDto {
  id: number;
  projectId: number;
  title: string;
  description: string;
  price: number;
  limitQuantity?: number;
  soldQuantity: number;
  createdAt: string;
}

// 프로젝트 상세 (관리자용)
export interface AdminProjectDetailDto {
  project: AdminProjectSummaryDto;
  rewardTiers: AdminRewardTierSummaryDto[];
  pledges: AdminPledgeSummaryDto[];
}

// 경매 검색 조건
export interface AdminAuctionSearchCondition {
  title?: string;
  sellerUsername?: string;
  status?: AuctionStatus;
  startFrom?: string;
  startTo?: string;
}

// 경매 요약 (관리자용)
export interface AdminAuctionSummaryDto {
  id: number;
  sellerId: number;
  sellerUsername: string;
  currentWinnerId?: number;
  currentWinnerUsername?: string;
  title: string;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  auctionStatus: AuctionStatus;
  startAt: string;
  endAt: string;
  createdAt: string;
}

// 경매 상세 (관리자용)
export interface AdminAuctionDetailDto {
  id: number;
  sellerId: number;
  sellerUsername: string;
  winnerId?: number;
  winnerUsername?: string;
  currentWinnerId?: number;
  currentWinnerUsername?: string;
  title: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  auctionStatus: AuctionStatus;
  startAt: string;
  endAt: string;
  createdAt: string;
  bids: AdminBidSummaryDto[];
}

// 페이징 응답
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// 포인트 조정 요청
export interface AdjustPointRequestDto {
  userId: number;
  adjustPoint: number;
  reason: string;
}

// SMS 전송 요청
export interface SmsToPhoneRequestDto {
  phoneNumber: string;
  message: string;
}

// ==================== 검색 API 타입 ====================

// 자동완성 응답
export interface SearchAutoCompleteResponse {
  title: string;
}

// 프로젝트 검색 응답
export interface ProjectSearchResponse {
  id: number;
  title: string;
  thumbnailUrl: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  startAt: string;
  endAt: string;
}

// 경매 검색 응답
export interface AuctionSearchResponse {
  id: number;
  title: string;
  imageKey: string;
  seller: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  status: string;
  startAt: string;
  endAt: string;
}
