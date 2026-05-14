# DDIP 프론트엔드

Next.js(App Router) 앱입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run generate:types` | 실행 중인 백엔드 `v3/api-docs`에서 타입 생성 |
| `npm run generate:types:local` | 로컬 `swagger.json`에서 타입 생성 |

백엔드 URL·환경 변수는 팀 설정(`.env` 등)을 따릅니다.
