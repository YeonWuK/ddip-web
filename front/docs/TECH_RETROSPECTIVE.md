# DDIP 프로젝트 기술 회고록

> 19개 채팅 세션을 바탕으로 정리한 문제 해결 과정과 기술적 결정 사항입니다.  

---

## 필살기 1. 인증 — 토큰 갱신 흐름 (401 vs 500 + sessionExpired)

### 상황
Access Token 만료 시 백엔드가 500을 반환해 프론트의 refresh 로직이 동작하지 않았다. 사용자는 갑자기 로그인이 끊기는 경험을 했다.

### 근본 원인
- 프론트는 **401일 때만** refresh 시도
- 백엔드가 `TokenExpiredException`을 500으로 반환

### 해결
1. **백엔드**: `@ControllerAdvice`에서 토큰 만료 시 **401**로 변환
2. **프론트 apiClient**: 401 수신 시 `ensureRefreshedToken()` → refresh 성공 시 같은 요청 1회 재시도
3. **refresh 실패 시**: `window.dispatchEvent(new CustomEvent('auth:sessionExpired'))`
4. **auth-context**: `auth:sessionExpired` 리스너에서 `tokenStorage.clearAll()` + `setUser(null)` + `setIsAuthenticated(false)`로 화면상 로그아웃 처리

### 역할 분리
- **apiClient**: 401 → 갱신 시도 → 실패 시 이벤트 dispatch (인증·HTTP 책임)
- **auth-context**: 이벤트 수신 → 상태 정리 (UI·세션 책임)

### 1분 답변
> "토큰 만료 시 500이 나와 refresh가 안 됐는데, 백엔드와 맞춰 401로 통일했습니다. apiClient에서 401이면 refresh 후 같은 요청을 1회 재시도하고, refresh까지 실패하면 sessionExpired 이벤트를 보냅니다. auth-context가 이 이벤트를 받아 토큰·사용자 상태를 정리해서, 사용자는 끊김 없이 이용하다가 세션 만료 시에만 로그아웃되는 UX가 되도록 했습니다."

### 꼬리 질문
- **"refresh 요청 자체가 실패하면?"**  
  → sessionExpired 이벤트 발생 → auth-context에서 로그아웃 처리. 무한 루프 방지됩니다.

---

## 필살기 2. API 정합성 — Swagger 단일 소스 (Single Source of Truth)

### 상황
Hero 배너 "진행 중인 프로젝트" 0 표시, 입찰가 0원·Invalid Date, `/api/auction/my-bids` 400 등 런타임 에러가 잦았다. Swagger DTO와 프론트 타입·호출 경로가 어긋나 있었다.

### 근본 원인
- 명세와 실제 응답 구조 불일치 (배열 vs `{ content: [...] }`)
- Swagger에는 있으나 백엔드 미구현·경로 다른 경우

### 해결
- **Swagger를 단일 진실 공급원**으로 두고 프론트 타입·엔드포인트를 명세에 맞춤
- 당장은 fallback으로 호환 유지, **장기적으로는 명세와 구현을 일치**시키는 방향으로 리팩토링
- fallback은 임시 조치로 보고, 제거 목표 명시

### 1분 답변
> "API 응답 구조가 들쭉날쭉해서 런타임 에러가 많았습니다. Swagger를 단일 소스로 정하고 프론트 타입을 DTO에 엄격히 맞췄습니다. 당장은 fallback으로 처리하되, 장기적으로는 명세와 구현을 일치시키는 쪽으로 가고 있습니다. 이렇게 하니 API 변경 시 영향 범위 파악과 디버깅이 훨씬 수월해졌습니다."

### 꼬리 질문
- **"백엔드가 명세를 안 고쳐주면?"**  
  → 구체적인 에러 로그·발생 경로를 공유하고, 명세 수정이 전체 생산성에 미치는 영향을 설득하는 식으로 커뮤니케이션할 것 같습니다.

---

## 필살기 3. 성능 — 검색 회복탄력성 + 입력 반응성 (Promise.allSettled, useDeferredValue)

### 상황
- 경매 검색 ES 역직렬화 실패 시 **검색 화면 전체**가 깨짐
- 리워드 수량 입력 시 계산 로직 때문에 **입력이 렉** 걸림

### 해결
1. **검색**: `Promise.allSettled`로 감싸서 경매 검색이 실패해도 프로젝트 결과는 표시 (일부 실패 허용)
2. **입력**: `useDeferredValue`로 총 금액·버튼 상태는 지연 업데이트, 입력값은 즉시 반영해 체감 반응성 유지

### 1분 답변
> "검색은 여러 API를 같이 호출하는데, 경매 쪽이 실패하면 화면 전체가 에러로 떴습니다. Promise.allSettled로 바꿔서 일부가 실패해도 나머지는 보여주도록 했습니다. 수량 입력은 연산 때문에 렉이 걸려서 useDeferredValue로 계산 결과만 지연 처리하고, 입력 자체는 즉각 반응하도록 했습니다."

### 꼬리 질문
- **"useDeferredValue로도 렉이 남으면?"**  
  → Web Worker로 계산을 분리하거나 메모이제이션을 더 최적화하는 방향으로 검토할 것 같습니다. (현재는 적용 전 단계)

---

## 4. 입찰 — 내역 표시 + delta 0 검증

### 상황
- 입찰 내역: 수정 전엔 0원·현재가 표시, 수정 후엔 입찰가는 맞는데 현재가 미표시
- delta 0 에러: "포인트 변화량은 0이 될 수 없습니다"

### 원인
- `lastBidPrice` 매핑 실패 시 0 → 조건 분기 꼬임. 정상 매핑 시 최고 입찰자면 `currentPrice ≈ lastBidPrice`라 "현재가" 노출 조건이 false
- 현재가와 동일·낮은 금액 입찰 → delta 0

### 해결
- "현재가"는 **다른 사람이 더 높이 입찰했을 때만** 표시
- 입찰 직전 최신 currentPrice 재조회, `bidAmount <= currentPrice`면 요청 차단

---

## 5. WebSocket 프로토콜 불일치

### 상황
백엔드 STOMP over WebSocket, 프론트 Socket.IO 사용 → 실시간 통신 불가.

### 결정
프로토콜을 먼저 맞추는 것이 우선. 프론트를 SockJS + STOMP로 변경하는 방향.

---

## 6. 공용 컴포넌트 스타일링 — Open-Closed 원칙

### 상황
메인 화면 카드 크기를 줄이려 할 때, 공용 `card.tsx`를 수정할지 vs 개별 카드에서 override할지 선택 필요.

### 결정
`card.tsx`는 수정하지 않고, `ProjectCard`/`AuctionCard`에서 `className`으로 override. **확장에는 열려 있고 수정에는 닫혀 있게** 설계.

---

## 7. UX — 상태별 구분 UI + 글로벌 상태 즉시 반영

### 상태별 구분
실패/취소/거절/일시정지 — 원인·후속 행동이 다르므로 상태별 구분 UI. 메인은 OPEN/RUNNING만, 목록엔 FAILED/CANCELED 등 배지.

### 글로벌 상태 즉시 반영
리워드 구매 후 포인트 차감이 바로 안 보임. `refreshUser()` 호출로 auth-context의 user 갱신 → 네비게이션 포인트 즉시 반영.

---

## 8. 이미지·날짜 처리 (mainIndex/mainImageId, timezone)

### 이미지
- **mainIndex**: 이번 요청의 새 multipart 배열 인덱스
- **mainImageId**: DB 기존 이미지 ID
- 둘은 동시 전송 불가, 상황에 따라 하나만 전송

### 날짜
`toISOString()`은 UTC 변환으로 **하루 밀림**. 백엔드 `LocalDate`(YYYY-MM-DD)에 맞게 날짜 문자열 그대로 전송.

---

## 9. 대형 API 파일 분리 — 도메인 단위 책임 분리

### 상황
2,300줄 이상 `api.ts`를 유지보수 가능한 단위로 분리.

### 전략
1. 독립 모듈부터: `imageUtils.ts`, `apiClient.ts`
2. 이후 Crowd·Auction 등 **도메인별**로 분리
3. 특정 도메인 변경이 다른 곳에 미치는 영향 최소화

### 복잡도 원인 (분리 전)
- 백엔드·프론트 타입 불일치 fallback 다수
- 100줄 넘는 긴 함수, Creator·이미지 등 분기 과다

---

## 10. multipart 연동 — FormData + DTO 직렬화

### 상황
프로젝트·경매 생성 시 백엔드가 `multipart/form-data`로 `data`(JSON)와 `file`(이미지)를 받는데, 프론트가 DTO와 맞지 않음.

### 적용
FormData에 `data` 파트(JSON.stringify), `file` 파트(파일 배열)를 각각 담아 전송. 백엔드 DTO 필드명·타입에 맞게 직렬화.

---

## 11. 에러/로딩 경계 — Next.js App Router 파일 기반

### 상황
페이지 렌더 중 예상치 못한 throw 발생 시 화면이 깨지거나 빈 화면이 됨. 로딩 상태가 라우트별로 일관되지 않음.

### 해결
1. **error.tsx**: `'use client'` 필수. `reset()` 버튼으로 재시도. 전역 + 프로젝트/경매 상세 세그먼트에 분리 적용.
2. **loading.tsx**: 세그먼트 준비 전 Suspense fallback으로 스피너 표시.
3. **역할 분리**: error.tsx는 렌더 throw, 페이지 내 try-catch는 API 실패.
4. **의도적 에러 테스트**: `?forceError=1` (NODE_ENV !== production일 때만)로 경계 QA 가능.

### 1분 답변
> "Next.js App Router의 error.tsx, loading.tsx를 써서 라우트 단위로 에러·로딩 경계를 둡니다. 에러가 나면 해당 세그먼트만 깨지고, reset()으로 재시도할 수 있습니다. 예상 에러는 try-catch로, 예상치 못한 렌더 에러는 error.tsx가 처리하도록 역할을 나눴습니다."

---

## 요약표

| 주제 | 핵심 한 줄 |
|------|------------|
| 토큰 | 401로 통일, refresh 후 1회 재시도, 실패 시 sessionExpired |
| API/Swagger | Swagger 단일 소스, fallback은 임시 |
| 성능 | Promise.allSettled + useDeferredValue |
| 입찰 | 매핑·조건 설계, delta 0 프론트 검증 |
| WebSocket | 프로토콜(STOMP vs Socket.IO) 먼저 맞추기 |
| 공용 컴포넌트 | Open-Closed, 사용처에서 override |
| UX | 상태별 구분, refreshUser로 글로벌 반영 |
| 이미지·날짜 | mainIndex/mainImageId 구분, YYYY-MM-DD |
| API 분리 | 도메인 단위 책임, 영향도 최소화 |
| multipart | data(JSON) + file 파트, DTO 맞추기 |
| 에러/로딩 경계 | error.tsx + loading.tsx, 세그먼트별 분리, reset 복구 |
