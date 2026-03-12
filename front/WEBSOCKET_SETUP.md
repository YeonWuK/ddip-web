# 웹소켓 실시간 경매 시스템 설정 가이드

## 개요
Spring WebSocket(STOMP) 기반 실시간 경매 통합. 입찰 및 경매 종료 이벤트를 실시간 수신합니다.

## 현재 상태
- ✅ STOMP 클라이언트 (`@stomp/stompjs`) 설치 완료
- ✅ 웹소켓 연결 관리 훅 (`useAuctionSocket`)
- ✅ 실시간 입찰 내역 컴포넌트 (`RealtimeBidList`)
- ✅ 경매 상세 페이지 웹소켓 연동 완료

## 연결 정보

| 항목 | 값 |
|------|-----|
| 프로토콜 | STOMP over WebSocket |
| 연결 주소 | `ws://localhost:8080/ws` |
| 구독 토픽 | `/topic/auction/{auctionId}` |
| 인증 | 없음 (JWT 미사용) |
| 입찰 | REST API만 사용 (`POST /api/auction/{id}/bids`) |

## 환경 변수

`.env.local` 예시:

```env
# 웹소켓 URL (기본값: ws://localhost:8080/ws)
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# 웹소켓 활성화 (false로 설정 시 비활성화)
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

## 수신 메시지 타입

### BidsResponseDto (입찰)
```typescript
{
  id: number
  creationDate: string
  user: UserResponseDto
  auctionId: number
  price: number
}
```

### AuctionEndedEventDto (경매 종료)
```typescript
{
  auctionId: number
  title: string
  auctionStatus: 'RUNNING' | 'ENDED' | 'CANCELED'
  user: UserResponseDto | null  // 낙찰자
  currentPrice: number
  endAt: string
}
```

동일 토픽 `/topic/auction/{auctionId}`에서 두 타입이 전송되며, payload 구조로 구분합니다.

## 파일 구조

```
front/
├── src/
│   ├── hooks/
│   │   └── useAuctionSocket.ts    # STOMP 연결 및 구독
│   ├── types/
│   │   └── websocket.ts           # WebSocket 타입
│   └── components/
│       └── realtime-bid-list.tsx  # 실시간 입찰 목록
└── app/
    └── auction/
        └── [id]/
            └── page.tsx           # 경매 상세 (웹소켓 연동)
```

## 테스트 방법

1. 백엔드 웹소켓 서버 실행
2. 환경 변수 설정
3. 경매 상세 페이지 접속
4. 브라우저 개발자 도구 → Network → WS 탭에서 연결 확인
5. 다른 탭/브라우저에서 입찰 시 실시간 반영 확인
