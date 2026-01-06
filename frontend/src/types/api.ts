// 공통 사용자 타입
export interface UserResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
  phone: string | null;
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
  imageUrl: string | null;
  targetAmount: number;
  currentAmount: number;
  status: 'DRAFT' | 'OPEN' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  startAt: string;
  endAt: string;
  rewardTiers: RewardTierResponse[];
  createdAt: string;
}

// 경매 관련 타입
export interface AuctionResponse {
  id: number;
  seller: UserResponse;
  title: string;
  description: string;
  imageUrl: string | null;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  buyoutPrice: number | null;
  status: 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED';
  startAt: string;
  endAt: string;
  winner: UserResponse | null;
}
