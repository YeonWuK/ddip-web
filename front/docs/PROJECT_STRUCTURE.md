# DDIP 프로젝트 구조 문서

## 📁 전체 디렉토리 구조

```
front/
├── app/                          # Next.js App Router 페이지
│   ├── layout.tsx               # 루트 레이아웃 (AuthProvider, Toaster, WishlistMonitor 포함)
│   ├── page.tsx                 # 메인 페이지 (큐레이션된 콘텐츠: 인기 프로젝트/경매, 마감 임박)
│   ├── globals.css              # 전역 스타일
│   ├── favicon.ico              # 파비콘
│   │
│   ├── login/                   # 로그인 페이지
│   │   └── page.tsx
│   │
│   ├── register/                # 회원가입 페이지
│   │   └── page.tsx
│   │
│   ├── profile/                 # 마이페이지
│   │   └── page.tsx            # 프로젝트/경매/후원/입찰/찜한 항목 관리
│   │
│   ├── search/                  # 검색 페이지
│   │   └── page.tsx            # 프로젝트/경매 통합 검색 (필터/정렬 지원)
│   │
│   ├── projects/                # 전체 프로젝트 목록 페이지
│   │   └── page.tsx            # 무한 스크롤, 필터/정렬 지원
│   │
│   ├── auctions/                # 전체 경매 목록 페이지
│   │   └── page.tsx            # 무한 스크롤, 필터/정렬 지원
│   │
│   ├── project/                 # 크라우드펀딩 프로젝트
│   │   ├── [id]/               # 프로젝트 상세 페이지
│   │   │   ├── page.tsx
│   │   │   └── edit/           # 프로젝트 수정 페이지
│   │   │       └── page.tsx
│   │   └── create/             # 프로젝트 생성 페이지
│   │       └── page.tsx
│   │
│   ├── auction/                 # 경매
│   │   ├── [id]/               # 경매 상세 페이지
│   │   │   ├── page.tsx
│   │   │   └── edit/           # 경매 수정 페이지
│   │   │       └── page.tsx
│   │   └── create/             # 경매 생성 페이지
│   │       └── page.tsx
│   │
│   └── auth/                   # 인증 관련
│       └── oauth/
│           └── callback/
│               └── page.tsx    # OAuth 콜백 처리
│
├── src/                         # 소스 코드
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sonner.tsx      # Toast 알림
│   │   │   └── tabs.tsx
│   │   │
│   │   ├── auction-card.tsx    # 경매 카드 컴포넌트 (위시리스트 포함)
│   │   ├── empty-state.tsx    # 빈 상태 컴포넌트 (데이터 없을 때 표시)
│   │   ├── filter-bar.tsx     # 필터/정렬 바 컴포넌트
│   │   ├── hero-banner.tsx     # 메인 페이지 히어로 배너 (검색, 카테고리, 통계)
│   │   ├── image-upload.tsx    # 단일 이미지 업로드 컴포넌트
│   │   ├── multi-image-upload.tsx # 다중 이미지 업로드 컴포넌트
│   │   ├── navigation.tsx      # 네비게이션 바 (로고, 링크, 사용자 메뉴)
│   │   ├── project-card.tsx    # 프로젝트 카드 컴포넌트 (위시리스트 포함)
│   │   ├── protected-route.tsx # 인증이 필요한 페이지 보호 컴포넌트
│   │   ├── realtime-bid-list.tsx # 실시간 입찰 내역 리스트 (웹소켓용)
│   │   ├── reward-card.tsx     # 리워드 티어 카드
│   │   ├── reward-tier-form.tsx # 리워드 티어 입력 폼
│   │   └── wishlist-monitor.tsx # 찜한 경매 모니터링 컴포넌트 (전역)
│   │
│   ├── contexts/               # React Context
│   │   └── auth-context.tsx    # 인증 상태 관리 (로그인, 로그아웃, 사용자 정보)
│   │
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useAuctionSocket.ts # 경매 웹소켓 훅 (실시간 입찰)
│   │   └── useWishlistAuctionMonitor.ts # 찜한 경매 상태 모니터링 훅
│   │
│   ├── lib/                     # 유틸리티 함수
│   │   ├── auction-notifications.ts # 경매 알림 유틸리티 (시작/종료 알림)
│   │   ├── auth.ts             # 인증 토큰 관리 (localStorage)
│   │   ├── date-utils.ts       # 날짜 파싱/포맷팅 유틸리티
│   │   ├── format-amount.ts    # 금액 포맷팅 (만원, 억원 등)
│   │   ├── permissions.ts      # 권한 체크 유틸리티
│   │   ├── user-utils.ts       # 사용자 관련 유틸리티 (마스킹, 상대 시간)
│   │   ├── validations.ts      # Zod 스키마 (폼 검증)
│   │   └── wishlist.ts         # 위시리스트 관리 (localStorage)
│   │
│   ├── services/               # API 서비스
│   │   └── api.ts              # Mock API (프로젝트, 경매, 인증, 후원, 입찰)
│   │                           # 페이지네이션 지원 (page, limit)
│   │
│   ├── stores/                  # 전역 상태 관리 (Zustand)
│   │   └── filterStore.ts      # 필터/정렬 상태 관리 (localStorage persist)
│   │
│   └── types/                   # TypeScript 타입 정의
│       ├── api.ts              # API 요청/응답 타입
│       └── websocket.ts        # 웹소켓 이벤트 타입
│
├── lib/                         # 루트 레벨 유틸리티 (shadcn/ui용)
│   └── utils.ts                # cn() 함수 (클래스 병합)
│
├── public/                      # 정적 파일
│
├── docs/                        # 프로젝트 문서
│   ├── BACKEND_MIGRATION_CHECKLIST.md # 백엔드 연동 체크리스트
│   ├── GEMINI_FEEDBACK_ANALYSIS.md    # Gemini 피드백 분석
│   ├── INTERVIEW_POINTS.md            # 면접 포인트 정리
│   ├── MVP_STATUS.md                  # MVP 완료 상태
│   ├── PROJECT_STRUCTURE.md           # 프로젝트 구조 문서 (이 파일)
│   └── retrospective-mock-api.md      # Mock API 회고
│
├── components.json              # shadcn/ui 설정
├── next.config.ts               # Next.js 설정 (이미지 도메인 등)
├── package.json                 # 의존성 및 스크립트
├── tsconfig.json                # TypeScript 설정
├── postcss.config.mjs           # PostCSS 설정
├── eslint.config.mjs            # ESLint 설정
└── WEBSOCKET_SETUP.md           # 웹소켓 설정 가이드
```

---

## 🎯 주요 기능별 구조

### 1. **인증 시스템** (`auth`)
- **Context**: `src/contexts/auth-context.tsx`
  - 전역 인증 상태 관리
  - `login()`, `logout()`, `register()` 함수
  - 사용자 정보 및 로딩 상태
  
- **유틸리티**: `src/lib/auth.ts`
  - `tokenStorage`: localStorage 기반 토큰 관리
  - `accessToken`, `refreshToken`, `user` 저장/조회

- **보호된 라우트**: `src/components/protected-route.tsx`
  - 인증이 필요한 페이지 보호
  - 미인증 시 `/login`으로 리다이렉트

- **페이지**:
  - `app/login/page.tsx`: 로그인 폼
  - `app/register/page.tsx`: 회원가입 폼
  - `app/auth/oauth/callback/page.tsx`: OAuth 콜백 처리

---

### 2. **크라우드펀딩 프로젝트** (`project`)
- **타입**: `src/types/api.ts`
  - `ProjectResponse`, `RewardTierResponse`, `SupportRequest`, `SupportResponse`

- **API**: `src/services/api.ts`
  - `projectApi.getProjects({ page, limit, status })`: 프로젝트 목록 조회 (페이지네이션, 필터링)
  - `projectApi.getProject(id)`: 프로젝트 상세 조회
  - `projectApi.createProject()`: 프로젝트 생성
  - `projectApi.updateProject()`: 프로젝트 수정
  - `projectApi.supportProject()`: 프로젝트 후원
  - `projectApi.getMySupports()`: 내 후원 내역
  - `projectApi.checkAllProjectsStatus()`: 모든 프로젝트 상태 일괄 체크

- **페이지**:
  - `app/page.tsx`: 메인 페이지 (큐레이션: 인기 프로젝트, 마감 임박)
  - `app/projects/page.tsx`: 전체 프로젝트 목록 (무한 스크롤, 필터/정렬)
  - `app/project/[id]/page.tsx`: 프로젝트 상세 (후원하기 버튼)
  - `app/project/[id]/edit/page.tsx`: 프로젝트 수정
  - `app/project/create/page.tsx`: 프로젝트 생성 폼

- **컴포넌트**:
  - `src/components/project-card.tsx`: 프로젝트 카드 (위시리스트 하트 버튼)
  - `src/components/reward-card.tsx`: 리워드 티어 카드
  - `src/components/reward-tier-form.tsx`: 리워드 티어 입력 폼

---

### 3. **경매 시스템** (`auction`)
- **타입**: `src/types/api.ts`
  - `AuctionResponse`, `BidResponse`

- **API**: `src/services/api.ts`
  - `auctionApi.getAuctions({ page, limit, status })`: 경매 목록 조회 (페이지네이션, 필터링)
  - `auctionApi.getAuction(id)`: 경매 상세 조회
  - `auctionApi.createAuction()`: 경매 생성
  - `auctionApi.updateAuction()`: 경매 수정
  - `auctionApi.placeBid()`: 입찰하기
  - `auctionApi.getBidsByAuction()`: 경매별 입찰 내역
  - `auctionApi.getMyBids()`: 내 입찰 내역
  - `auctionApi.checkAllAuctionsStatus()`: 모든 경매 상태 일괄 체크

- **페이지**:
  - `app/page.tsx`: 메인 페이지 (큐레이션: 인기 경매, 마감 임박)
  - `app/auctions/page.tsx`: 전체 경매 목록 (무한 스크롤, 필터/정렬)
  - `app/auction/[id]/page.tsx`: 경매 상세 (입찰하기, 입찰 내역, 실시간 업데이트)
  - `app/auction/[id]/edit/page.tsx`: 경매 수정
  - `app/auction/create/page.tsx`: 경매 생성 폼

- **컴포넌트**:
  - `src/components/auction-card.tsx`: 경매 카드 (위시리스트 하트 버튼)
  - `src/components/realtime-bid-list.tsx`: 실시간 입찰 내역 (웹소켓용)

- **웹소켓**: `src/hooks/useAuctionSocket.ts`
  - 실시간 입찰 업데이트 (백엔드 준비되면 활성화)

- **알림 시스템**:
  - `src/lib/auction-notifications.ts`: 경매 시작/종료 알림 유틸리티
  - `src/hooks/useWishlistAuctionMonitor.ts`: 찜한 경매 상태 모니터링 (1분마다 체크)
  - `src/components/wishlist-monitor.tsx`: 전역 모니터링 컴포넌트
  - `app/layout.tsx`에 `<WishlistMonitor />` 포함

---

### 4. **필터/정렬 시스템** (`filter`)
- **상태 관리**: `src/stores/filterStore.ts` (Zustand)
  - 프로젝트 필터: `projectStatus`, `projectSort`
  - 경매 필터: `auctionStatus`, `auctionSort`
  - localStorage persist (페이지 새로고침 시 유지)

- **컴포넌트**: `src/components/filter-bar.tsx`
  - 프로젝트/경매 필터/정렬 UI
  - 드롭다운으로 상태/정렬 선택
  - 필터 초기화 버튼

- **유틸리티 함수**: `src/stores/filterStore.ts`
  - `filterAndSortProjects()`: 프로젝트 필터링 및 정렬
  - `filterAndSortAuctions()`: 경매 필터링 및 정렬

- **적용 페이지**:
  - `app/projects/page.tsx`: 전체 프로젝트 목록
  - `app/auctions/page.tsx`: 전체 경매 목록
  - `app/search/page.tsx`: 검색 결과

---

### 5. **무한 스크롤** (`infinite-scroll`)
- **구현 방식**: Intersection Observer API
- **페이지**:
  - `app/projects/page.tsx`: 프로젝트 무한 스크롤
  - `app/auctions/page.tsx`: 경매 무한 스크롤

- **특징**:
  - API 페이지네이션 지원 (`page`, `limit`)
  - 필터 변경 시 페이지 초기화
  - Observer 타겟 항상 렌더링 (visibility로 숨김)
  - `rootMargin: '200px'`로 미리 로드

---

### 6. **위시리스트** (`wishlist`)
- **유틸리티**: `src/lib/wishlist.ts`
  - `addToWishlist()`: 위시리스트 추가
  - `removeFromWishlist()`: 위시리스트 제거
  - `toggleWishlist()`: 위시리스트 토글
  - `isInWishlist()`: 위시리스트 확인
  - `getWishlist()`: 전체 위시리스트 조회
  - localStorage 기반 저장

- **통합**:
  - `src/components/project-card.tsx`: 프로젝트 카드에 하트 버튼
  - `src/components/auction-card.tsx`: 경매 카드에 하트 버튼
  - `app/profile/page.tsx`: "찜한 항목" 탭에서 위시리스트 표시

- **경매 알림**:
  - 찜한 경매가 시작/종료될 때 알림 표시
  - `useWishlistAuctionMonitor` 훅으로 1분마다 상태 체크

---

### 7. **마이페이지** (`profile`)
- **페이지**: `app/profile/page.tsx`
  - 5개 탭:
    1. **내 프로젝트**: 내가 생성한 프로젝트 목록
    2. **내 경매**: 내가 생성한 경매 목록
    3. **후원 내역**: 내가 후원한 프로젝트 목록
    4. **입찰 내역**: 내가 입찰한 경매 목록
    5. **찜한 항목**: 위시리스트 (프로젝트 + 경매)

- **URL 파라미터**: `?tab=favorites`로 찜한 항목 탭 자동 선택

---

### 8. **검색 시스템** (`search`)
- **페이지**: `app/search/page.tsx`
  - 프로젝트/경매 통합 검색
  - 필터/정렬 지원
  - 빈 상태 처리

---

### 9. **UI 컴포넌트** (`components`)
- **shadcn/ui 기본 컴포넌트**: `src/components/ui/`
  - Button, Card, Input, Badge, Alert, Tabs, Avatar, Separator, Progress, DropdownMenu, Dialog, Sonner

- **커스텀 컴포넌트**:
  - `navigation.tsx`: 네비게이션 바 (로고, 링크, 검색, 알림, 찜, 프로필)
  - `hero-banner.tsx`: 메인 페이지 배너 (검색바, 카테고리, 통계, CTA 버튼)
  - `empty-state.tsx`: 빈 상태 컴포넌트 (데이터 없을 때 표시)
  - `filter-bar.tsx`: 필터/정렬 바
  - `image-upload.tsx`: 단일 이미지 업로드 (base64 변환)
  - `multi-image-upload.tsx`: 다중 이미지 업로드 (최대 3장)
  - `protected-route.tsx`: 인증 보호 컴포넌트
  - `wishlist-monitor.tsx`: 찜한 경매 모니터링 (전역)

---

### 10. **유틸리티 함수** (`lib`)
- **`auth.ts`**: 토큰 관리
- **`auction-notifications.ts`**: 경매 알림 (시작/종료, 중복 방지)
- **`date-utils.ts`**: 날짜 파싱, 포맷팅, 검증
- **`format-amount.ts`**: 금액 포맷팅 (예: "2억", "10만")
- **`permissions.ts`**: 권한 체크 (프로젝트/경매 수정 권한)
- **`user-utils.ts`**: 사용자 아이디 마스킹, 상대 시간 표시
- **`validations.ts`**: Zod 스키마 (프로젝트/경매 생성 폼 검증)
- **`wishlist.ts`**: 위시리스트 관리

---

### 11. **데이터 관리** (`services/api.ts`)
- **Mock API**: localStorage 기반 데이터 저장
- **저장소**:
  - `projectStore`: 프로젝트 데이터 (Map)
  - `auctionStore`: 경매 데이터 (Map)
  - `supportStore`: 후원 내역 (Map)
  - `bidStore`: 입찰 내역 (Map)
  - `imageStore`: 이미지 캐시 (Map, in-memory)
  - localStorage에 자동 동기화

- **API 그룹**:
  - `projectApi`: 프로젝트 관련 API (페이지네이션, 필터링 지원)
  - `auctionApi`: 경매 관련 API (페이지네이션, 필터링 지원)
  - `authApi`: 인증 관련 API
  - `userApi`: 사용자 관련 API

- **Mock 데이터 생성**:
  - `generateMockProjects(count)`: 대량 프로젝트 생성 (테스트용)
  - 초기화 시 100개 프로젝트 자동 생성

---

## 🔧 주요 설정 파일

### `package.json`
- **프레임워크**: Next.js 16.0.10, React 19.2.0
- **UI 라이브러리**: shadcn/ui (Radix UI 기반)
- **폼 관리**: React Hook Form + Zod
- **상태 관리**: Zustand 5.0.10
- **스타일링**: Tailwind CSS 4.1.9
- **알림**: Sonner (Toast)
- **날짜**: date-fns 4.1.0, react-day-picker 9.8.0
- **웹소켓**: socket.io-client 4.8.3 (준비됨, 미활성화)

### `tsconfig.json`
- **Path Alias**: `@/*` → 루트 디렉토리
- **타겟**: ES2017
- **모듈**: ESNext

### `next.config.ts`
- **이미지 도메인**: `picsum.photos` 허용

---

## 📊 데이터 흐름

### 1. **인증 흐름**
```
로그인 → authApi.login() → tokenStorage 저장 → AuthContext 업데이트 → 전역 상태 반영
```

### 2. **프로젝트 생성 흐름**
```
프로젝트 생성 폼 → Zod 검증 → projectApi.createProject() → localStorage 저장 → 목록 업데이트
```

### 3. **위시리스트 흐름**
```
하트 버튼 클릭 → toggleWishlist() → localStorage 저장 → 카드 UI 업데이트 → 프로필 페이지 반영
```

### 4. **입찰 흐름**
```
입찰 버튼 클릭 → auctionApi.placeBid() → bidStore 저장 → 경매 가격 업데이트 → 입찰 내역 새로고침
```

### 5. **필터/정렬 흐름**
```
필터 변경 → filterStore 업데이트 → localStorage 저장 → API 호출 (필터링) → 클라이언트 정렬 → UI 업데이트
```

### 6. **무한 스크롤 흐름**
```
스크롤 → Intersection Observer 트리거 → loadMore() → API 호출 (다음 페이지) → 데이터 추가 → UI 업데이트
```

### 7. **경매 알림 흐름**
```
WishlistMonitor (전역) → useWishlistAuctionMonitor → 1분마다 찜한 경매 상태 체크 → 상태 변경 감지 → 알림 표시 (중복 방지)
```

---

## 🚀 주요 기능 요약

✅ **완료된 기능**
- 인증 시스템 (로그인, 회원가입, 로그아웃, OAuth)
- 프로젝트 생성/수정 및 후원
- 경매 생성/수정 및 입찰
- 위시리스트 (찜하기)
- 마이페이지 (프로젝트/경매/후원/입찰/찜한 항목 관리)
- 필터/정렬 시스템 (Zustand, localStorage persist)
- 무한 스크롤 (프로젝트/경매 목록)
- 경매 알림 시스템 (찜한 경매 시작/종료 알림)
- 실시간 입찰 내역 표시
- 이미지 업로드 (단일/다중, base64)
- 날짜 검증 및 포맷팅
- 금액 포맷팅 (만원, 억원)
- 빈 상태 컴포넌트
- 검색 기능
- 페이지네이션 (API 레벨)

⏳ **준비됨 (백엔드 대기)**
- 웹소켓 실시간 입찰 (`useAuctionSocket.ts`)
- 실시간 입찰 내역 컴포넌트 (`realtime-bid-list.tsx`)

---

## 📝 참고 문서

- `WEBSOCKET_SETUP.md`: 웹소켓 설정 가이드
- `BACKEND_MIGRATION_CHECKLIST.md`: 백엔드 연동 체크리스트
- `MVP_STATUS.md`: MVP 완료 상태
- `INTERVIEW_POINTS.md`: 면접 포인트 정리
- `GEMINI_FEEDBACK_ANALYSIS.md`: Gemini 피드백 분석

---

## 🔍 주요 파일 위치

| 기능 | 파일 경로 |
|------|----------|
| 메인 페이지 | `app/page.tsx` |
| 전체 프로젝트 목록 | `app/projects/page.tsx` |
| 전체 경매 목록 | `app/auctions/page.tsx` |
| 프로젝트 상세 | `app/project/[id]/page.tsx` |
| 경매 상세 | `app/auction/[id]/page.tsx` |
| 마이페이지 | `app/profile/page.tsx` |
| 검색 | `app/search/page.tsx` |
| Mock API | `src/services/api.ts` |
| 인증 Context | `src/contexts/auth-context.tsx` |
| 필터 Store | `src/stores/filterStore.ts` |
| 위시리스트 | `src/lib/wishlist.ts` |
| 경매 알림 | `src/lib/auction-notifications.ts` |
| 네비게이션 | `src/components/navigation.tsx` |
| 히어로 배너 | `src/components/hero-banner.tsx` |
| 필터 바 | `src/components/filter-bar.tsx` |
| 빈 상태 | `src/components/empty-state.tsx` |

---

## 🏗️ 아키텍처 패턴

### 상태 관리
- **전역 상태**: Zustand (`filterStore`)
- **인증 상태**: React Context (`AuthContext`)
- **로컬 상태**: React `useState`
- **서버 상태**: Mock API (localStorage)

### 데이터 저장
- **인증 토큰**: localStorage (`tokenStorage`)
- **위시리스트**: localStorage (`wishlist`)
- **필터 상태**: localStorage (Zustand persist)
- **프로젝트/경매 데이터**: localStorage (Mock API)

### 컴포넌트 구조
- **페이지**: Next.js App Router (`app/`)
- **재사용 컴포넌트**: `src/components/`
- **UI 기본 컴포넌트**: `src/components/ui/` (shadcn/ui)
- **커스텀 훅**: `src/hooks/`
- **유틸리티**: `src/lib/`

---

**마지막 업데이트**: 2026년 1월
**프로젝트명**: DDIP (크라우드펀딩 & 경매 플랫폼)
**버전**: 0.1.0