# 1. 빌드 단계
FROM node:20-alpine AS builder
WORKDIR /app

# 종속성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
# 빌드 시 환경변수가 필요하다면 여기에 추가 (예: NEXT_PUBLIC_API_URL)
RUN npm run build

# 2. 실행 단계
FROM node:20-alpine AS runner
WORKDIR /app

# 보안을 위해 시스템 권한이 낮은 유저 설정
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 빌드 결과물 중 실행에 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]