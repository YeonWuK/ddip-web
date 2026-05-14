# DDIP Web

크라우드펀딩과 경매를 한 서비스에서 다루는 **DDIP**의 웹 클라이언트입니다. Next.js(App Router) 기반으로 프로젝트·경매·검색·마이페이지·관리자·OAuth 등 핵심 사용자 흐름을 구현합니다.

| 항목 | 링크 |
|------|------|
| 저장소(프론트 작업 브랜치) | [github.com/didwldnd/ddip-web/tree/features/front-setup](https://github.com/didwldnd/ddip-web/tree/features/front-setup) |
| 프론트 앱 | [`front/`](./front/) |

---

## 개요

사용자는 프로젝트(펀딩)와 경매를 탐색·참여하고, 마이페이지에서 후원·입찰·찜 등 내역을 관리합니다. 관리자는 승인·거절 등 운영 UI를 통해 콘텐츠를 다룹니다. 백엔드 REST·WebSocket과 연동하는 구조를 전제로 합니다.

**문제에 가깝게 다뤘던 것**: API 명세와 프론트 타입 불일치, 토큰 만료 시 HTTP 상태와 refresh 가정 불일치, 단일 거대 API 모듈로 인한 유지보수 부담 등.

**목표**: 사용자 입장에서는 끊김·빈 화면·검색 전체 실패를 줄이고, 개발 입장에서는 명세 기반 타입과 도메인 단위 모듈로 변경 영향을 줄이는 것.

---

## 주요 기능

- **크라우드펀딩**: 목록(무한 스크롤, 필터·정렬), 상세·생성·수정, 리워드 후원
- **경매**: 목록·상세·생성·수정, 입찰·내역, 실시간 입찰(STOMP/WebSocket)
- **통합 검색**: 프로젝트·경매 검색, SEO용 메타데이터
- **마이페이지**: 후원·입찰·찜 등 내역
- **관리자**: 사용자·프로젝트·경매 탭 UI
- **인증**: 로그인·회원가입·OAuth 콜백·프로필 완성

---

## 기술 스택

| 구분 | 사용 |
|------|------|
| 프레임워크 | Next.js 16, React 19, App Router |
| 언어 | TypeScript 5 |
| UI | Tailwind CSS 4, shadcn/ui(Radix) |
| 상태 | Zustand(persist), React Context(인증) |
| 폼·검증 | React Hook Form, Zod |
| API 타입 | openapi-typescript(Swagger → `api.generated.ts`) |
| 실시간 | @stomp/stompjs |

로컬 실행은 `front` 디렉터리에서 `npm install` 후 `npm run dev`를 사용합니다. 자세한 안내는 [`front/README.md`](./front/README.md)를 참고하세요.

---

## 구현·설계에서 강조할 포인트

1. **API 레이어**: 단일 거대 파일을 도메인별 서비스로 분리하고, 중앙 `api.ts`는 Re-export 허브로 유지
2. **인증**: 401 기준 토큰 갱신 후 동일 요청 1회 재시도, 실패 시 세션 만료 이벤트로 HTTP 레이어와 UI 상태 분리
3. **검색·입력**: `Promise.allSettled`로 부분 실패 허용, `useDeferredValue` 등으로 입력 반응성과 무거운 계산 분리
4. **App Router**: `error.tsx` / `loading.tsx`, `generateMetadata`로 에러 복구·SEO

---

## 트러블슈팅 예시

| 주제 | 한 줄 요약 |
|------|----------------|
| 토큰 만료 | 만료 응답을 401로 통일하고 refresh → 재시도 → 실패 시 세션 정리 |
| Swagger 정합성 | 명세를 단일 소스로 두고 타입·엔드포인트 정리, 임시 fallback은 제거 목표로 관리 |
| 검색 회복력 | 일부 API 실패 시에도 나머지 결과 표시 |
| 관리자 모달 | 상태 초기화를 함수형 업데이트로 통일해 overlay 잔류 방지 |

---

## 성과(코드베이스 기준 수치)

- API 중앙 모듈을 **약 2,300줄 → 약 74줄(Re-export 허브)** 수준으로 정리한 리팩토링이 반영되어 있습니다. 세부 표는 로컬 문서를 참고하세요.

비즈니스 지표(MAU, 전환율 등)는 이 README에 포함하지 않습니다.

---

## 문서(로컬만)

`front/docs/` 아래의 구조 설명·회고·면접 정리 등은 **Git에 올리지 않도록** 설정되어 있습니다. 팀원은 각자 로컬에서만 유지하거나, 공유가 필요하면 별도 채널을 사용하세요.

---

## 라이선스

저장소에 `LICENSE` 파일이 있으면 해당 조항을 따릅니다. 없을 경우 조직·팀 규칙을 확인하세요.
