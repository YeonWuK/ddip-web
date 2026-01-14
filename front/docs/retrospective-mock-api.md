# 백엔드 연동 전, Mock API로 프론트엔드를 먼저 구축한 이야기

> **DDIP** - 크라우드펀딩 & 경매 플랫폼 개발 회고록  
> Next.js 16 + React 19 + TypeScript로 만든 풀스택 프로젝트의 프론트엔드 단계 회고

---

## 🎯 왜 Mock API부터 시작했을까?

프로젝트 초기 단계에서 백엔드 개발자가 없거나, 백엔드 API가 준비되지 않은 상황에서 프론트엔드 개발을 시작해야 할 때가 있다. 우리는 이런 상황에서 **"서버 없는 환경"**을 먼저 구축하기로 결정했다.

### Mock API 설계 의도

```typescript
// src/services/api.ts
const projectStore = new Map<number, ProjectResponse>();
const auctionStore = new Map<number, AuctionResponse>();
const supportStore = new Map<number, SupportResponse>();
const bidStore = new Map<number, BidResponse>();

// localStorage 키
const PROJECT_STORE_KEY = 'ddip_projects';
const AUCTION_STORE_KEY = 'ddip_auctions';
```

**핵심 아이디어**: 
- **Map 객체**로 인메모리 저장소 구축 (빠른 조회)
- **localStorage**로 브라우저 새로고침 후에도 데이터 유지
- 실제 API와 동일한 인터페이스로 설계하여 **나중에 교체가 쉬움**

### 이 방식의 이점

1. **독립적인 개발 속도**
   - 백엔드 API를 기다리지 않고 UI/UX 개발 가능
   - 프론트엔드 개발자가 전체 플로우를 먼저 검증 가능

2. **빠른 프로토타이핑**
   - 실제 서버 없이도 모든 기능을 테스트 가능
   - 사용자 시나리오를 바로 확인 가능

3. **타입 안정성 확보**
   - TypeScript로 API 인터페이스를 먼저 정의
   - 백엔드 개발자와 협업 시 명확한 계약(Contract) 제공

---

## 🏗️ 기술적 챌린지: 복잡한 관계형 데이터를 로컬에서 관리하기

크라우드펀딩과 경매 플랫폼은 단순한 CRUD가 아니다. 프로젝트-후원, 경매-입찰, 사용자-프로젝트 등 **복잡한 관계형 데이터**를 다뤄야 한다.

### Map 객체와 스토어 구조

```typescript
// 인메모리 저장소 (빠른 조회)
const projectStore = new Map<number, ProjectResponse>();
const auctionStore = new Map<number, AuctionResponse>();
const supportStore = new Map<number, SupportResponse>();
const bidStore = new Map<number, BidResponse>();

// localStorage 동기화
function saveProjectsToStorage(): void {
  try {
    const projects = Array.from(projectStore.values());
    localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('프로젝트 저장 실패:', error);
  }
}
```

**왜 Map을 선택했나?**
- `O(1)` 조회 성능 (ID로 바로 접근)
- 배열보다 빠른 삽입/삭제
- 키-값 구조가 데이터베이스와 유사

### 관계형 데이터 처리 전략

**1. 프로젝트 후원 시 연관 데이터 업데이트**
```typescript
async supportProject(data: SupportRequest): Promise<SupportResponse> {
  // 프로젝트 조회
  const project = projectStore.get(data.projectId);
  
  // 프로젝트 현재 금액 업데이트
  const updatedProject = {
    ...project,
    currentAmount: project.currentAmount + data.amount,
    rewardTiers: project.rewardTiers.map(tier =>
      tier.id === data.rewardTierId
        ? { ...tier, soldQuantity: tier.soldQuantity + 1 }
        : tier
    ),
  };
  
  // 후원 내역 저장
  supportStore.set(supportId, support);
  projectStore.set(data.projectId, updatedProject);
  
  // localStorage 동기화
  saveProjectsToStorage();
  saveSupportsToStorage();
}
```

**2. 경매 입찰 시 가격 업데이트**
```typescript
async placeBid(auctionId: number, amount: number): Promise<AuctionResponse> {
  const auction = auctionStore.get(auctionId);
  
  // 입찰 검증
  if (amount <= auction.currentPrice + auction.bidStep) {
    throw new Error(`최소 입찰가는 ${auction.currentPrice + auction.bidStep}원입니다`);
  }
  
  // 경매 가격 업데이트
  const updatedAuction = {
    ...auction,
    currentPrice: amount,
  };
  
  // 입찰 내역 저장
  const bid: BidResponse = {
    id: Date.now(),
    auctionId,
    auctionTitle: auction.title,
    amount,
    bidder: getCurrentUser(),
    createdAt: new Date().toISOString(),
  };
  
  bidStore.set(bid.id, bid);
  auctionStore.set(auctionId, updatedAuction);
  
  saveAuctionsToStorage();
  saveBidsToStorage();
  
  return updatedAuction;
}
```

**핵심 포인트**:
- 트랜잭션처럼 여러 저장소를 동시에 업데이트
- 데이터 일관성 유지 (프로젝트 금액 = 후원 합계)
- localStorage 동기화로 새로고침 후에도 데이터 유지

---

## ✅ 검증의 디테일: 데이터 무결성과 사용자 경험 보완

AI가 작성한 초기 코드는 기능적으로는 동작했지만, **엣지 케이스**와 **사용자 경험** 측면에서 보완이 필요했다.

### 1. Zod 스키마로 폼 검증 강화

**초기 문제**: 날짜 입력 시 "Invalid time value" 에러가 자주 발생

**해결책**: `validations.ts`에 상세한 검증 로직 추가

```typescript
// src/lib/validations.ts
export const auctionCreateSchema = z.object({
  startAt: z.string().min(1, "시작일을 선택해주세요").refine((val) => {
    if (!val) return false
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    // 시작일은 현재 시간 이후여야 함
    return date > new Date()
  }, "경매 시작일은 현재 시간 이후여야 합니다"),
  endAt: z.string().min(1, "종료일을 선택해주세요"),
}).refine((data) => {
  // 종료일은 시작일 이후여야 함
  const startDate = new Date(data.startAt)
  const endDate = new Date(data.endAt)
  return endDate > startDate
}, {
  message: "종료일은 시작일 이후여야 합니다",
  path: ["endAt"], // endAt 필드에 에러 표시
})
```

**개선 효과**:
- 사용자가 잘못된 날짜를 입력하기 전에 미리 차단
- 명확한 에러 메시지로 UX 개선
- 서버로 잘못된 데이터가 전송되는 것을 방지

### 2. 금액 포맷팅으로 사용자 경험 개선

**초기 문제**: 큰 금액이 "20000만원"처럼 어색하게 표시됨

**해결책**: `format-amount.ts`로 자연스러운 한국어 단위 변환

```typescript
// src/lib/format-amount.ts
export function formatAmountShort(amount: number): string {
  if (amount >= 100000000) {
    // 1억 이상
    const eok = Math.floor(amount / 100000000)
    const remainder = amount % 100000000
    if (remainder === 0) {
      return `${eok}억`
    }
    const man = Math.floor(remainder / 10000)
    return `${eok}억 ${man}만`
  } else if (amount >= 10000) {
    // 1만 이상
    const man = Math.floor(amount / 10000)
    const remainder = amount % 10000
    if (remainder === 0) {
      return `${man}만`
    }
    const cheon = Math.floor(remainder / 1000)
    return `${man}만 ${cheon}천`
  }
  // ...
}
```

**개선 효과**:
- "20000만원" → "2억원"으로 자연스럽게 표시
- 사용자가 금액을 빠르게 인지 가능
- 한국어 사용자에게 친숙한 표현

### 3. 날짜 파싱 안전성 강화

**초기 문제**: ISO 문자열과 일반 날짜 문자열이 섞여서 파싱 에러 발생

**해결책**: `date-utils.ts`로 안전한 날짜 파싱

```typescript
// src/lib/date-utils.ts
export function parseDate(dateString: string): Date {
  // ISO 형식인지 확인
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
    return new Date(dateString)
  }
  // 일반 날짜 형식이면 시간 추가
  return new Date(dateString.includes("T") ? dateString : `${dateString}T00:00:00`)
}
```

**개선 효과**:
- 다양한 날짜 형식을 안전하게 처리
- "Invalid time value" 에러 완전 제거
- 사용자 입력에 더 관대한 검증

### 4. 사용자 아이디 마스킹과 상대 시간 표시

**요구사항**: 여러 유저가 사용할 때 프라이버시 보호

**해결책**: `user-utils.ts`로 마스킹 및 상대 시간 표시

```typescript
// src/lib/user-utils.ts
export function maskUserId(user: UserResponse): string {
  const displayName = user.nickname || user.name || user.email || "익명"
  if (displayName.length <= 3) {
    return displayName
  }
  // 앞 2글자 + *** + 뒤 2글자
  const prefix = displayName.slice(0, 2)
  const suffix = displayName.slice(-2)
  return `${prefix}***${suffix}`
}

export function formatRelativeTime(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  
  if (diffSec < 60) return "방금 전"
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  // ...
}
```

**개선 효과**:
- "user123" → "us***23"으로 프라이버시 보호
- "2024-01-01 10:00:00" → "5분 전"으로 직관적 표시
- 입찰 내역에서 실시간감 있는 UX 제공

---

## 🔮 백엔드 연동을 위한 포석: 타입 독립 설계

Mock API를 만들 때 가장 중요한 것은 **"나중에 실제 API로 교체하기 쉽게"** 설계하는 것이다.

### 타입 중심 설계

```typescript
// src/types/api.ts
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
```

**핵심 전략**:
- **타입을 먼저 정의** → Mock API와 실제 API 모두 같은 타입 사용
- **인터페이스 분리** → Request/Response 타입 명확히 구분
- **공통 타입 추출** → `UserResponse` 등 재사용 가능한 타입 정의

### API 함수 시그니처 통일

```typescript
// Mock API와 실제 API가 동일한 시그니처
export const projectApi = {
  getProjects: async (params?: { limit?: number }): Promise<ProjectResponse[]> => {
    // Mock 구현
  },
  getProject: async (id: number): Promise<ProjectResponse> => {
    // Mock 구현
  },
  createProject: async (data: Omit<ProjectResponse, 'id' | 'creator' | 'createdAt'>): Promise<ProjectResponse> => {
    // Mock 구현
  },
}
```

**나중에 실제 API로 교체할 때**:
```typescript
// 실제 API로 교체 시 함수 시그니처는 그대로 유지
export const projectApi = {
  getProjects: async (params?: { limit?: number }): Promise<ProjectResponse[]> => {
    const response = await fetch('/api/projects', { ... })
    return response.json()
  },
  // 나머지도 동일한 패턴
}
```

**장점**:
- 컴포넌트 코드 수정 없이 API만 교체 가능
- 타입 안정성 유지
- 점진적 마이그레이션 가능

### 웹소켓 준비: useAuctionSocket 훅

실시간 경매를 위해 웹소켓도 미리 준비했다.

```typescript
// src/hooks/useAuctionSocket.ts
export function useAuctionSocket(): UseAuctionSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected')
  
  // 백엔드가 준비되지 않았으면 소켓 연결하지 않음
  if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'false') {
    return {
      isConnected: false,
      connectionStatus: 'disabled',
      // Mock API로 폴백
    }
  }
  
  // 실제 웹소켓 연결 로직
}
```

**설계 철학**:
- 웹소켓이 없어도 Mock API로 동작 가능
- 환경 변수로 활성화/비활성화 제어
- 백엔드 준비되면 주석만 해제하면 바로 사용 가능

---

## 🚀 Next Step: 백엔드 연동 후 도전할 과제들

Mock API로 프론트엔드를 완성했지만, 실제 백엔드와 연동할 때는 새로운 도전이 기다린다.

### 1. JWT 인증 및 토큰 관리

**현재**: localStorage에 토큰 저장 (Mock)

**도전 과제**:
- Access Token / Refresh Token 로테이션
- 토큰 만료 시 자동 갱신
- HTTP-only Cookie vs localStorage 보안 고려
- Axios Interceptor로 토큰 자동 첨부

```typescript
// 향후 구현 예시
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh Token으로 재시도
      const newToken = await refreshAccessToken()
      tokenStorage.setAccessToken(newToken)
      return apiClient.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

### 2. 실시간 양방향 통신 (WebSocket)

**현재**: `useAuctionSocket.ts` 훅 준비됨 (비활성화)

**도전 과제**:
- Socket.io 서버와 연결
- 실시간 입찰 업데이트
- 연결 끊김 시 자동 재연결
- 여러 경매 방 동시 참여 관리

```typescript
// 백엔드 연동 후 활성화할 코드
useEffect(() => {
  if (auctionId && isConnected) {
    joinAuction(auctionId)
    onBidPlaced((event) => {
      setAuction(prev => ({ ...prev, currentPrice: event.amount }))
      toast.success(`새로운 입찰! ${event.bidder.nickname}: ${event.amount.toLocaleString()}원`)
    })
  }
  return () => {
    if (auctionId && isConnected) {
      leaveAuction(auctionId)
    }
  }
}, [auctionId, isConnected])
```

### 3. 이미지 업로드 및 관리

**현재**: base64로 localStorage 저장 (임시)

**도전 과제**:
- 실제 파일 서버로 업로드 (S3, Cloudinary 등)
- 이미지 최적화 및 리사이징
- 업로드 진행률 표시
- 에러 처리 및 재시도 로직

### 4. 페이지네이션 및 무한 스크롤

**현재**: `limit` 파라미터로 제한적 페이징

**도전 과제**:
- 서버 사이드 페이지네이션
- React Query / SWR로 캐싱 및 무한 스크롤
- 필터링 및 정렬 기능

### 5. 에러 처리 및 사용자 피드백

**현재**: Toast 알림으로 기본 에러 표시

**도전 과제**:
- 네트워크 에러, 타임아웃 처리
- 재시도 로직
- 에러 바운더리로 예외 상황 처리
- 사용자 친화적인 에러 메시지

---

## 💡 회고: Mock API로 얻은 것들

### 성공 요인

1. **빠른 개발 속도**
   - 백엔드를 기다리지 않고 UI/UX 완성
   - 전체 플로우를 먼저 검증 가능

2. **타입 안정성**
   - TypeScript로 API 계약을 먼저 정의
   - 백엔드 개발자와 협업 시 명확한 스펙 제공

3. **점진적 마이그레이션**
   - Mock API → 실제 API 교체가 쉬움
   - 컴포넌트 코드 수정 최소화

### 아쉬운 점

1. **데이터 영속성**
   - localStorage는 브라우저별로 독립적
   - 실제 서버 데이터와 동기화 필요

2. **동시성 문제**
   - 여러 탭에서 동시 수정 시 충돌 가능
   - 실제 서버에서는 트랜잭션으로 해결

3. **성능 제한**
   - 대량 데이터 처리 시 localStorage 한계
   - 실제 서버에서는 인덱싱 및 최적화 가능

---

## 🎓 결론

Mock API로 프론트엔드를 먼저 구축한 것은 **"빠른 프로토타이핑"**과 **"타입 중심 설계"**의 좋은 사례였다. 

특히 복잡한 관계형 데이터를 Map 객체와 localStorage로 관리한 경험은, 실제 백엔드 API 설계 시에도 도움이 될 것이다. 그리고 Zod 스키마, 금액 포맷팅, 날짜 검증 등 **디테일한 검증 로직**을 추가한 과정은 사용자 경험을 크게 개선했다.

이제 백엔드 연동 단계에서는 **JWT 인증**, **실시간 웹소켓**, **이미지 업로드** 등 새로운 도전이 기다린다. 하지만 Mock API 단계에서 쌓은 타입 안정성과 인터페이스 설계 경험은, 이번 도전들을 더 수월하게 만들어줄 것이다.

---

**프로젝트**: DDIP (크라우드펀딩 & 경매 플랫폼)  
**기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui  
**개발 기간**: Mock API 단계 완료  
**다음 단계**: 백엔드 API 연동 및 웹소켓 실시간 통신

---

*이 글은 Velog 포스팅 형식으로 작성되었습니다.*
