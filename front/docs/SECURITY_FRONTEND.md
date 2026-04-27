# DDIP 프론트엔드 보안 개선 (면접용 요약)

> localStorage·PII·에러 메시지·CSP·백엔드 협업 포인트를 정리한 문서입니다.

---

## 1. localStorage 토큰 / XSS 대응 (가장 큰 흐름)

### 상황
- Access/Refresh 토큰과 사용자 JSON을 `localStorage`에 둔 상태였다.
- **XSS**가 한 번 발생하면 `localStorage`는 스크립트로 읽을 수 있어, **토큰·PII 탈취**로 직결된다.

### 해결 (프론트)
- **Access Token**은 `localStorage`에 두지 않고, **탭 생명주기 동안만 메모리(모듈 스코프)**에 보관.
- **Refresh Token**은 JSON으로 저장/전송하지 않고, **기존처럼 `POST /api/users/refresh-token` + `credentials: 'include'`**만 사용(백엔드가 `HttpOnly` 쿠키로 관리하는 전제).
- **새로고침** 후 메모리는 비어 있으므로, `tryRestoreAccessTokenFromRefreshCookie()`로 쿠키 기반 **세션 복구 시도** → 성공 시에만 `getCurrentUser()`.
- **기존 사용자**를 위해 `ddip_*` localStorage 키는 **최초 1회 읽고 메모리로 옮긴 뒤 삭제**하는 마이그레이션.
- `auth-context` 초기화: (메모리 토큰 또는 쿠키 복구) → `getCurrentUser()` / 실패 시 사용자 null.

### 백엔드와의 관계
- Refresh는 **쿠키**로 맞는 것이 정석. 본문에 refresh를 실어 보내지 말고, `Set-Cookie`로 `HttpOnly` + `Secure`(프로덕션) + 적절한 `SameSite`를 요청하는 것이 좋다.

### 1분 답변
> "XSS에 대비해 토큰과 PII는 localStorage에 안 두는 쪽으로 바꿨어요. 액세스 토큰은 메모리에만 두고, 리프레시는 원래 쿠키 `include`로만 갱신하니까, 새로고침 때는 리프레시 쿠키로 액세스 토큰을 다시 받아서 메모리에 올리는 흐름이에요. 예전 키는 한 번 흡수하고 지우는 마이그레이션도 넣었고요. 근본적으로는 HttpOnly 쿠키·SameSite·CORS는 백엔드와 맞춰야 합니다."

### 꼬리 질문
- **"메모리 토큰도 XSS에 안전한가?"**  
  → **아니다.** 스크립트가 실행되면 그 순간 메모리/헤더를 훔칠 수 있어, **CSP·입력 검증**이 같이 가야 한다. localStorage를 비운 것은 **지속성 있는 탈취·스코프**를 줄이는 조치.

---

## 2. PII(사용자 정보) localStorage 제거

### 상황
- `UserResponse`를 JSON으로 `localStorage`에 저장 → 이메일·전화 등 **민감 정보 평문 노출**.

### 해결
- **사용자 정보는 React state + API**로만 유지. `tokenStorage.setUser` / `getUser` API 제거.

### 1분 답변
> "PII는 스토리지에 두지 말고, 로그인 후에는 state에 두고 프로필은 API로 갱신하는 쪽이 낫다고 판단해서, 사용자 JSON localStorage는 없앴습니다."

---

## 3. API 에러 메시지 — 서버 내부 유출 방지

### 상황
- 실패 응답의 `detail` / `message`를 그대로 `Error`로 던지면, 백엔드 실수로 **SQL·스택**이 섞이면 **공격 힌트**가 될 수 있다.

### 해결
- `toSafeApiErrorMessage` (`src/lib/apiErrorMessages.ts`):
  - **5xx** → 고정된 일반 문구(사용자용).
  - **4xx** → 짧고 안전한 메시지는 노출, 스택/쿼리 패턴 등은 **기본(클라이언트) 문구**로 대체.
- `apiRequest`, `userService`의 직접 `fetch` 실패에도 동일 정제 적용.
- **디버깅용** `console.error`는 유지(운영에서 노출이 아닌 개발자 콘솔).

### 1분 답변
> "API 에러를 그대로 화면에 뿌리면 서버 쪽 정보가 새 나갈 수 있어서, 상태 코드에 따라 5xx는 항상 일반 문구, 4xx는 JSON에서 꺼내더라도 SQL이나 스택 같으면 막는 레이어를 뒀어요. 로그는 콘솔에 남깁니다."

---

## 4. CSP (Content-Security-Policy) — 보조막

### 상황
- **XSS 자체는 CSP로 줄일 수** 있으나, Next·외부 위젯·HMR과 충돌하기 쉽다.

### 해결
- `next.config.ts`에서 **`NODE_ENV === 'production'`일 때만** CSP 헤더 적용 (개발 `next dev`는 미적용).
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors` 등으로 기본 면을 줄이고, **API/WS**는 `NEXT_PUBLIC_*` 기준으로 `connect-src`에 반영, **다음 우편번호** iframe·Vercel Analytics·이미지/S3·`img-src` 등을 허용 목록에 맞춤.
- `script-src`는 Next 특성상 **`'unsafe-inline'`**이 필요한 구간이 있어, "완전 엄격한 nonce CSP"는 아님(추가 하드닝은 [공식 문서](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)의 nonce·middleware 패턴 검토).

### 1분 답변
> "CSP는 프로덕션에만 걸어서, XSS 시 로드/연결할 수 있는 출처를 제한합니다. dev에서는 HMR 때문에 빼뒀고, 스크립트는 아직 inline 허용이 있어서 완벽하진 않지만, object-src 끄고 connect를 API·WS·필수 서드파티에 맞춰 줄였어요. 더 빡세게 가려면 nonce 기반으로 가야 합니다."

---

## 5. 하지 않은 것 (의도) — DOMPurify, href 검증

### dangerouslySetInnerHTML
- **현재 코드베이스에 없음** → DOMPurify·sanitize 의존성을 **지금은 추가하지 않음**.
- **나중에** WYSIWYG로 HTML을 `dangerouslySetInnerHTML`에 넣는 순간, **DOMPurify(또는 서버 측 sanitize)** 는 **필수**에 가깝다.

### `href`에 `javascript:` 등
- 링크는 대부분 **내부 경로·숫자 id**라서, **사용자가 입력한 URL을 그대로 `href`에 쓰는 UI가 생기기 전**엔 별도 유틸을 두지 않음.

### 1분 답변
> "DOMPurify는 HTML을 raw로 박는 코드가 있을 때 쓰는 도구고, 지금은 그런 렌더링이 없어서 안 넣었어요. href도 외부 입력 URL을 직접 쓰는 곳이 없으면 `javascript:` 방어는 그때 넣는 게 맞다고 봤어요."

---

## 파일·역할 정리 (짧게)

| 구분 | 파일/위치 | 역할 |
|------|------------|------|
| 토큰(메모리) | `src/lib/auth.ts` | Access만 메모리, 레거시 localStorage 1회 정리 |
| HTTP + refresh | `src/services/apiClient.ts` | 401 → refresh, `tryRestore…`, 실패 시 `auth:sessionExpired` |
| 인증 state | `src/contexts/auth-context.tsx` | 초기 복구, 로그인/로그아웃, 사용자는 state만 |
| 에러 정제 | `src/lib/apiErrorMessages.ts` | `toSafeApiErrorMessage` |
| API 서비스 | `src/services/userService.ts` | 로그인/회원가입/OAuth fetch 등에 동일 정제 |
| CSP | `next.config.ts` | 프로덕션 전역 헤더 |

---

## 백엔드에 맞출 때 체크리스트 (한 줄씩)

1. Refresh: **쿠키 `HttpOnly`**, 프로덕션 `Secure`, `SameSite`·도메인 정책 합의.
2. CORS: `Allow-Credentials: true` + **프론트 Origin** 고정(와일드카드+자격 증명 불가).
3. 로그아웃: refresh 쿠키 **만료/삭제**.
4. API 에러: **짧은 메시지/코드**로 통일, SQL·스택·경로 **본문 금지** (프론트 5xx 마스킹과 합쳐짐).

이 문서만으로 "보안을 어떻게 개선했는지"를 **STAR에 가깝게** 풀어 말할 수 있도록 구성해 두었습니다.
