# DDIP 프로젝트 기술 회고록 (면접용)

> 19개 채팅 세션을 바탕으로 정리한 문제 해결 과정과 기술적 결정 사항입니다.

---

## 1. 공통 컴포넌트 vs 개별 컴포넌트 스타일링 전략

### 상황
메인 화면 프로젝트·경매 카드를 현재 크기의 70%로 줄이려고 할 때, `ui/card.tsx`를 수정할지 vs `ProjectCard`/`AuctionCard`에서 `className`으로 override할지 선택이 필요했다.

### 고민
- `card.tsx`는 로그인/회원가입, 상세 페이지, 관리자 대시보드 등 **여러 화면에서 공통 사용**
- 기본 padding/gap을 줄이면 **프로젝트 전체**에 영향

### 결정
- `card.tsx`는 수정하지 않고, `ProjectCard`/`AuctionCard`에서만 `className`으로 padding·gap을 override
- **원칙**: 공용 UI 컴포넌트의 기본 스타일은 유지하고, 화면별 차이는 사용처에서 주입

### 면접에서 말할 수 있는 답변
> "공용 컴포넌트 수정 시 영향 범위를 먼저 파악하고, 공통 레이아웃은 유지한 채 특정 화면만 스타일을 덮어쓰는 방식으로 설계했습니다."

---

## 2. API 응답 구조·Swagger·DTO 정합성 (통합)

### 상황
- Hero 배너 "진행 중인 프로젝트" 0 표시, 프로필 입찰가 0원·Invalid Date, `/api/auction/my-bids` 400
- Swagger DTO(`MyBidsSummaryDto`, `LEADING` 등)와 프론트 타입 불일치
- Swagger에는 있으나 프론트 호출 경로·백엔드 구현이 다른 경우 (입찰, Admin 경매)

### 원인·대응
- **응답 구조**: 배열 vs `{ content: [...] }` 둘 다 처리, status/필드 fallback 매핑
- **fallback**: 임시 조치, 장기적으로는 명세·실제 응답 일치 후 제거
- **Swagger 기준**: 프론트 타입을 Swagger DTO에 맞춤, 엔드포인트·DTO 불일치 점검
- **명세 vs 구현**: 백엔드 미구현 시 우회 후 구현 확인되면 명세대로 복원

### 면접에서 말할 수 있는 답변
> "Swagger를 단일 소스로 두고 프론트 타입·호출 경로를 맞췄습니다. fallback은 임시 조치로 보고, 명세와 실제 응답을 일치시키는 게 우선이라고 판단했습니다."

---

## 3. 입찰 내역 표시 + 입찰 검증 (통합)

### 입찰 내역 표시
- **문제**: 수정 전 입찰가 0원·현재가 표시 vs 수정 후 입찰가 정상·현재가 미표시
- **원인**: `lastBidPrice` 매핑 실패 시 0 → `currentPrice > 0`으로 "현재가"만 보임. 정상 매핑 시 최고 입찰자면 `currentPrice ≈ lastBidPrice`라 조건 false
- **설계**: "현재가"는 다른 사람이 더 높이 입찰했을 때만 표시
- **입찰 시각**: 백엔드 저장·응답이 원칙, 프론트는 표시만 담당

### 입찰 delta 0 검증
- **문제**: `delta(포인트 변화량)는 0이 될 수 없습니다` 에러
- **원인**: 현재가와 동일·낮은 금액으로 입찰
- **적용**: 입찰 직전 최신 currentPrice 재조회, `bidAmount <= currentPrice`면 요청 차단

### 면접에서 말할 수 있는 답변
> "입찰 내역은 필드 매핑과 조건 설계가 핵심이었고, 입찰 검증은 delta 0 방지를 위해 직전 최신가를 다시 조회해 프론트에서 걸러냈습니다."

---

## 4. 토큰 만료·갱신 (401 vs 500 + 자동 갱신 흐름, 통합)

### 401 vs 500
- **문제**: Access Token 만료 시 500 → refresh 미동작
- **원인**: 프론트는 401일 때만 refresh, 백엔드가 `TokenExpiredException`을 500으로 반환
- **해결**: `@ControllerAdvice`에서 토큰 만료 시 **401**로 변환해 응답

### 자동 갱신 흐름
1. API 호출 → 401 수신
2. `ensureRefreshedToken()` → `refreshAccessToken()` (동시 401 시 refresh 1회만)
3. 새 토큰 저장 후 **같은 HTTP 요청** 1회 재시도
4. 갱신 실패 시 `auth:sessionExpired` 이벤트 → 로그아웃

### 역할 분리
- **apiClient**: 401 시 갱신·재시도
- **userService**: 최초 발급
- **auth-context**: 토큰 직접 발급/갱신 없음, 저장·세션 만료 처리만

### 면접에서 말할 수 있는 답변
> "토큰 만료는 401로 응답하도록 백엔드와 맞췄고, 프론트는 401 시 refresh 후 같은 요청을 1회 재시도하도록 설계했습니다."

---

## 5. WebSocket 프로토콜 불일치

### 상황
백엔드 STOMP over WebSocket, 프론트 Socket.IO 사용 → 실시간 통신 불가.

### 선택지
1. 프론트를 SockJS + STOMP로 변경 (추천)
2. 백엔드를 Socket.IO로 변경

### 면접에서 말할 수 있는 답변
> "실시간 통신 설계 시 프로토콜을 먼저 맞추는 것이 중요하다고 판단했습니다."

---

## 6. UX 관점의 상태 표시 설계

### 상황
실패/취소/거절/일시정지 — 4개 동일 UI vs 구분 UI

### 결정
- **상태별 구분 UI** 선택 (원인·후속 행동이 다름)
- 메인: OPEN/RUNNING만 표시, 목록: FAILED/CANCELED 등 배지 표시

### 면접에서 말할 수 있는 답변
> "사용자가 원인과 다음 액션을 이해할 수 있도록 상태별 구분 UI를 적용했습니다."

---

## 7. 상태 관리와 함수 반환값 설계

### 상황
찜하기 취소 시 계속 "찜하기 추가되었습니다"로 표시됨.

### 원인
- `toggleWishlist()`가 **작업 성공 여부**만 반환, 제거 시에도 true

### 해결
- 토글 후 **실제 찜 여부**를 `isInWishlist(id, type)`로 확인해 state 반영

### 면접에서 말할 수 있는 답변
> "함수 반환값의 의미(성공 여부 vs 현재 상태)를 구분하고, UI state는 실제 소스 데이터를 기준으로 갱신하도록 했습니다."

---

## 8. 프로젝트/경매 수정 — 이미지·날짜 처리 (통합)

### mainIndex vs mainImageId
- **mainIndex**: 이번 요청의 **새 파일(multipart)** 배열 인덱스
- **mainImageId**: DB **기존 이미지** ID
- 둘은 **동시 전송 불가** → 선택에 따라 하나만 전송

### mainImageIndex vs mainIndex
- API payload는 `mainIndex`로 전송, 프론트 내부 상태와 전송 키 혼동 방지

### 날짜 timezone
- `toISOString()` 사용 시 UTC 변환으로 **하루 밀림**
- 백엔드 `LocalDate`(YYYY-MM-DD) 형식에 맞게 **날짜 문자열 그대로** 전송

### 면접에서 말할 수 있는 답변
> "이미지는 mainIndex/mainImageId를 상황에 따라 하나만 보내고, 날짜는 toISOString 대신 YYYY-MM-DD 그대로 전송해 timezone 문제를 피했습니다."

---

## 9. 검색·입력 성능 (Promise.allSettled + useDeferredValue, 통합)

### 검색 부분 실패 허용
- **문제**: 경매 검색 ES 역직렬화 실패 시 전체 검색 화면 에러
- **적용**: `Promise.allSettled` → 경매 검색 실패해도 프로젝트 결과는 표시

### 입력 폼 성능
- **문제**: 수량 입력 시 계산 로직 때문에 렉
- **적용**: `useDeferredValue`로 총 금액·버튼 상태는 지연 업데이트, 입력 반응성 유지

### 면접에서 말할 수 있는 답변
> "검색은 Promise.allSettled로 일부 실패를 허용하고, 수량 입력은 useDeferredValue로 연산을 지연시켜 반응성을 유지했습니다."

---

## 10. 외부 UI 도구(Lovable, bolt.new) 적용 전략

### 전략
1. **페이지/컴포넌트 단위** 적용, 한 번에 전체 덮지 않기
2. **레이어 분리**: page.tsx는 상태·API·라우팅 유지, 렌더링만 교체
3. **props 기반**: 새 UI는 props로 데이터·핸들러만 받도록 설계

### 면접에서 말할 수 있는 답변
> "page 로직은 유지하고 렌더링만 교체하는 레이어 분리를 했습니다."

---

## 11. 구매 후 사용자 상태 즉시 반영

### 상황
리워드 구매 성공 후 포인트 차감이 바로 보이지 않아 사용자가 완료 여부를 헷갈려함.

### 원인
- 프로젝트 정보는 재조회하지만, **사용자 포인트**는 갱신하지 않음
- 네비게이션의 `user?.pointBalance`는 auth-context의 `user`를 사용

### 해결
- 구매 성공 후 `refreshUser()` 호출 → `user` 갱신 → 포인트 즉시 반영

### 면접에서 말할 수 있는 답변
> "결제·포인트 차감 등 글로벌 상태가 바뀌는 액션 후에는 auth-context의 refreshUser를 호출해, 네비게이션 등 공통 UI가 즉시 반영되도록 했습니다."

---

## 12. 대형 API 파일 분리 (도메인별 구조화)

### 상황
2,300줄 이상의 `api.ts`를 유지보수 가능한 단위로 분리하려 함.

### 전략
1. **1단계**: 독립적인 유틸·기본 클라이언트부터 분리
   - `imageUtils.ts`: `toS3ImageUrl`, `getProjectImageUrls` 등
   - `apiClient.ts`: `apiRequest`, `BASE_URL` 등
2. **의존성**: 분리된 함수는 export, 기존 `api.ts`에서는 import
3. **안전성**: 다른 도메인 로직은 건드리지 않고, 단계별로 빌드 확인

### 면접에서 말할 수 있는 답변
> "대형 api.ts를 imageUtils, apiClient 등 독립 모듈부터 분리하고, 이후 Crowd·Auction 등 도메인별로 단계적으로 쪼갰습니다. 빌드가 항상 통과하는지 확인하면서 진행했습니다."

---

## 13. 복잡한 코드 분석 (api.ts가 어려운 이유)

### 복잡도 요인
1. **백엔드·프론트 타입 불일치**: 여러 fallback 처리, 다양한 필드명·구조 대응
2. **긴 함수·조건 분기**: 프로젝트 목록 조회 등 100줄 이상 함수, Creator·이미지 등 분기 다수
3. **데이터 변환**: `getProjectImageUrls`에서 thumbnailUrl, imageUrls, imageKeys, images 등 여러 형태 처리

### 면접에서 말할 수 있는 답변
> "api.ts는 백엔드 응답을 프론트 타입으로 변환하는 fallback과 분기가 많아 복잡했습니다. 이를 줄이기 위해 도메인별 분리와 DTO 정합성을 맞추는 작업을 진행했습니다."

---

## 14. 어드민 페이지 기능 설계 (도메인 기반)

### 고려 사항
- DDIP: 크라우드펀딩 + 경매 플랫폼
- 기존 기능: 프로젝트·경매·입찰·후원·마이페이지·배송지·위시리스트

### 기능 제안
- **통계 대시보드**: 사용자 수, 활성 프로젝트/경매, 후원·입찰 금액, 추이
- **사용자 관리**: 목록·상세·권한 변경·정지·포인트 조정
- **프로젝트 관리**: 승인(DRAFT→OPEN), 거절·강제 중단·취소
- **경매 관리**: 목록·모니터링·강제 종료·취소
- **후원/입찰 관리**: 전체 내역·환불 처리

### 면접에서 말할 수 있는 답변
> "어드민 기능은 기존 도메인(프로젝트·경매·후원·입찰)과 Swagger Admin API를 기준으로 설계했습니다."

---

## 15. Edit 페이지 데이터 흐름 (getProject · JSON 구조)

### 데이터 출처
- **Edit 페이지**: `project/[id]/edit/page.tsx`에서 `projectApi.getProject(projectId)` 호출
- **API**: `GET /api/crowd/{projectId}`
- **서비스**: crowdService.getProject → apiRequest → 백엔드 응답을 `ProjectResponse`로 변환

### Edit 창에서 사용하는 JSON 구조
- `id`, `title`, `description`, `summary`, `targetAmount`, `startAt`, `endAt`, `categoryPath`, `tags`
- `imageUrls`, `mainImageId` (이미지)
- `rewardTiers`: `{ rewardTierId, title, description, price, limitQuantity, soldQuantity }[]`

### 면접에서 말할 수 있는 답변
> "Edit 페이지는 getProject로 백엔드 응답을 받아 ProjectResponse로 변환한 뒤 폼에 바인딩합니다. 백엔드 DTO와 프론트 타입 매핑을 명확히 해 두었습니다."

---

## 16. Daum 우편번호 API 연동 (react-daum-postcode)

### 상황
리워드 구매 시 배송지 정보 입력에서 우편번호·주소를 수동 입력하는 대신 검색 API를 쓰고 싶었다.

### 적용
- `react-daum-postcode` 패키지 설치 후 `useDaumPostcodePopup` 훅 사용
- "주소 검색" 버튼 클릭 시 Daum 우편번호 팝업 오픈 → 선택 시 `zonecode`, `roadAddress` 등을 폼에 자동 입력
- 모달 내부에서 모달을 띄우는 상황이어서 팝업 방식(`useDaumPostcodePopup`)으로 처리

### 참고
- PowerShell 구버전에서는 `&&`가 지원되지 않음 → `;`로 명령 구분 (`cd 경로; npm install ...`)

### 면접에서 말할 수 있는 답변
> "배송지 입력에 Daum 우편번호 API를 붙였고, 모달 안이라 팝업 방식인 useDaumPostcodePopup을 써서 주소 검색 후 zonecode와 roadAddress를 폼에 반영했습니다."

---

## 17. 백엔드 API·DTO 기반 multipart 프론트 연동

### 상황
크라우드펀딩(프로젝트)·경매 생성 시 백엔드가 `multipart/form-data`로 `data`(JSON DTO)와 `file`(이미지 목록)을 받는데, 프론트 요청이 DTO와 맞지 않는 문제가 있었다.

### 적용
- **경매 생성**: `POST /api/auction` → `file`(파일 배열), `data`(AuctionRequestDto: title, description, startPrice, bidStep, endAt)
- **프로젝트 생성/수정**: `POST·PATCH /api/crowd` → `data`(ProjectRequestDto / ProjectUpdateRequestDto), `file`(MultipartFile 목록)
- FormData 구성 시 `data` 파트는 `JSON.stringify()`로 직렬화
- 백엔드 S3 업로드는 서버에서 처리, 프론트는 multipart로 파일만 전달

### 면접에서 말할 수 있는 답변
> "프로젝트·경매 생성 API가 multipart/form-data를 쓰므로, FormData에 data(JSON 문자열)와 file 파트를 각각 담아 보내고, 백엔드 DTO 필드명과 타입에 맞게 직렬화했습니다."

---

## 요약 (면접 시 핵심 답변)

| 주제 | 한 줄 요약 |
|------|------------|
| 공용 컴포넌트 | 기본 스타일 유지, 화면별 스타일은 사용처에서 주입 |
| API·Swagger·DTO | Swagger 기준으로 타입·경로 맞추기, fallback은 임시 조치 |
| 입찰 | 내역 표시 = 매핑·조건 설계, 검증 = delta 0 방지 |
| 토큰 | 401로 통일, refresh 후 같은 요청 1회 재시도 |
| WebSocket | 프로토콜(STOMP vs Socket.IO) 먼저 맞추기 |
| UX/상태 | 상태별 원인·행동에 맞춘 구분 UI |
| 상태 관리 | 반환값 의미 구분, UI는 실제 소스 데이터 기준 |
| 이미지·날짜 | mainIndex/mainImageId 구분, YYYY-MM-DD 그대로 전송 |
| 검색·입력 | Promise.allSettled, useDeferredValue |
| 외부 UI | page 로직 유지, 렌더링만 교체 |
| 구매 후 반영 | refreshUser로 글로벌 상태 즉시 갱신 |
| 대형 파일 분리 | imageUtils·apiClient부터, 도메인별 단계적 분리 |
| 복잡도 분석 | fallback·변환 로직 정리, DTO 정합성 |
| 어드민 설계 | 도메인·Swagger 기반 기능 제안 |
| Edit 데이터 | getProject → ProjectResponse 변환 → 폼 바인딩 |
| Daum 우편번호 | useDaumPostcodePopup으로 배송지 폼에 주소·우편번호 자동 입력 |
| multipart 연동 | data(JSON) + file 파트로 DTO·이미지 전달, 백엔드 DTO 필드 맞추기 |
