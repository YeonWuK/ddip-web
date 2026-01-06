import {
  UserResponse,
  ProjectResponse,
  AuctionResponse,
  RewardTierResponse,
} from '@/src/types/api';

// Mock 데이터 생성 함수들
const createMockUser = (id: number, overrides?: Partial<UserResponse>): UserResponse => ({
  id,
  email: `user${id}@example.com`,
  name: `사용자${id}`,
  nickname: `nickname${id}`,
  profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
  phone: `010-${String(id).padStart(4, '0')}-${String(id * 2).padStart(4, '0')}`,
  ...overrides,
});

const createMockRewardTier = (
  id: number,
  overrides?: Partial<RewardTierResponse>
): RewardTierResponse => ({
  id,
  title: `리워드 티어 ${id}`,
  description: `리워드 티어 ${id}에 대한 설명입니다.`,
  price: (id + 1) * 10000,
  limitQuantity: id % 2 === 0 ? 100 : null,
  soldQuantity: Math.floor(Math.random() * 50),
  ...overrides,
});

const createMockProject = (
  id: number,
  overrides?: Partial<ProjectResponse>
): ProjectResponse => {
  const creator = createMockUser(id);
  const rewardTiers = [
    createMockRewardTier(id * 10 + 1),
    createMockRewardTier(id * 10 + 2),
    createMockRewardTier(id * 10 + 3),
  ];

  const statuses: ProjectResponse['status'][] = [
    'DRAFT',
    'OPEN',
    'SUCCESS',
    'FAILED',
    'CANCELED',
  ];
  const status = statuses[id % statuses.length];

  return {
    id,
    creator,
    title: `프로젝트 제목 ${id}`,
    description: `프로젝트 ${id}에 대한 상세 설명입니다.`,
    imageUrl: `https://picsum.photos/800/600?random=${id}`,
    targetAmount: 1000000,
    currentAmount: Math.floor(Math.random() * 1000000),
    status,
    startAt: new Date(Date.now() - id * 86400000).toISOString(),
    endAt: new Date(Date.now() + (30 - id) * 86400000).toISOString(),
    rewardTiers,
    createdAt: new Date(Date.now() - (id + 10) * 86400000).toISOString(),
    ...overrides,
  };
};

const createMockAuction = (
  id: number,
  overrides?: Partial<AuctionResponse>
): AuctionResponse => {
  const seller = createMockUser(id);
  const statuses: AuctionResponse['status'][] = [
    'SCHEDULED',
    'RUNNING',
    'ENDED',
    'CANCELED',
  ];
  const status = statuses[id % statuses.length];
  const winner = status === 'ENDED' ? createMockUser(id + 100) : null;

  return {
    id,
    seller,
    title: `경매 상품 ${id}`,
    description: `경매 상품 ${id}에 대한 상세 설명입니다.`,
    imageUrl: `https://picsum.photos/800/600?random=${id + 1000}`,
    startPrice: 50000,
    currentPrice: 50000 + id * 10000,
    bidStep: 5000,
    buyoutPrice: id % 2 === 0 ? 200000 : null,
    status,
    startAt: new Date(Date.now() - id * 86400000).toISOString(),
    endAt: new Date(Date.now() + (7 - id) * 86400000).toISOString(),
    winner,
    ...overrides,
  };
};

// API 함수들 - 프로젝트 관련
export const projectApi = {
  /**
   * 프로젝트 목록 조회
   */
  getProjects: async (params?: {
    status?: ProjectResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<ProjectResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const projects: ProjectResponse[] = [];
    const limit = params?.limit || 10;
    for (let i = 1; i <= limit; i++) {
      const project = createMockProject(i);
      if (!params?.status || project.status === params.status) {
        projects.push(project);
      }
    }
    return projects;
  },

  /**
   * 프로젝트 상세 조회
   */
  getProject: async (id: number): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockProject(id);
  },

  /**
   * 프로젝트 생성
   */
  createProject: async (
    data: Omit<ProjectResponse, 'id' | 'creator' | 'createdAt'>
  ): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockProject(Date.now(), {
      ...data,
      creator: createMockUser(1),
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * 프로젝트 수정
   */
  updateProject: async (
    id: number,
    data: Partial<ProjectResponse>
  ): Promise<ProjectResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockProject(id, data);
  },

  /**
   * 프로젝트 삭제
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteProject: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  },
};

// API 함수들 - 경매 관련
export const auctionApi = {
  /**
   * 경매 목록 조회
   */
  getAuctions: async (params?: {
    status?: AuctionResponse['status'];
    page?: number;
    limit?: number;
  }): Promise<AuctionResponse[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const auctions: AuctionResponse[] = [];
    const limit = params?.limit || 10;
    for (let i = 1; i <= limit; i++) {
      const auction = createMockAuction(i);
      if (!params?.status || auction.status === params.status) {
        auctions.push(auction);
      }
    }
    return auctions;
  },

  /**
   * 경매 상세 조회
   */
  getAuction: async (id: number): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockAuction(id);
  },

  /**
   * 경매 생성
   */
  createAuction: async (
    data: Omit<AuctionResponse, 'id' | 'seller' | 'winner'>
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockAuction(Date.now(), {
      ...data,
      seller: createMockUser(1),
      winner: null,
    });
  },

  /**
   * 경매 수정
   */
  updateAuction: async (
    id: number,
    data: Partial<AuctionResponse>
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockAuction(id, data);
  },

  /**
   * 경매 삭제
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteAuction: async (id: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  /**
   * 경매 입찰
   */
  placeBid: async (
    auctionId: number,
    bidAmount: number
  ): Promise<AuctionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const auction = createMockAuction(auctionId);
    return {
      ...auction,
      currentPrice: bidAmount,
    };
  },
};

// API 함수들 - 사용자 관련
export const userApi = {
  /**
   * 사용자 정보 조회
   */
  getUser: async (id: number): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockUser(id);
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return createMockUser(1);
  },

  /**
   * 사용자 정보 수정
   */
  updateUser: async (
    id: number,
    data: Partial<UserResponse>
  ): Promise<UserResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return createMockUser(id, data);
  },
};
