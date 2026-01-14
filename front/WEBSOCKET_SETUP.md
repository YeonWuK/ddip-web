# 웹소켓 실시간 경매 시스템 설정 가이드

## 개요
이 프로젝트는 실시간 경매를 위한 웹소켓 통합 준비가 완료되었습니다. 백엔드가 준비되면 간단히 활성화할 수 있습니다.

## 현재 상태
- ✅ 웹소켓 클라이언트 라이브러리 설치 완료 (`socket.io-client`)
- ✅ 웹소켓 연결 관리 훅 생성 완료 (`useAuctionSocket`)
- ✅ 실시간 입찰 내역 컴포넌트 준비 완료 (`RealtimeBidList`)
- ✅ 경매 상세 페이지에 웹소켓 통합 코드 준비 완료 (주석 처리됨)
- ⏳ 백엔드 웹소켓 서버 준비 중

## 백엔드 준비 완료 후 활성화 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일 생성:

```env
# 웹소켓 서버 URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# 웹소켓 활성화 (true로 설정)
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
```

### 2. 경매 상세 페이지 활성화
`front/app/auction/[id]/page.tsx` 파일에서:

1. **Import 주석 해제** (상단):
```typescript
// 이 주석들을 해제
import { useAuctionSocket } from "@/src/hooks/useAuctionSocket"
import { RealtimeBidList } from "@/src/components/realtime-bid-list"
import { BidPlacedEvent } from "@/src/types/websocket"
```

2. **상태 및 훅 주석 해제**:
```typescript
// 이 주석들을 해제
const [realtimeBids, setRealtimeBids] = useState<BidPlacedEvent[]>([])
const { isConnected, joinAuction, ... } = useAuctionSocket()
```

3. **웹소켓 이벤트 리스너 주석 해제** (useEffect 부분)

4. **입찰 핸들러 수정** (handleBid 함수 내부):
```typescript
// 웹소켓 사용 부분 주석 해제
if (isConnected) {
  socketPlaceBid(auctionId, bidAmount)
  return
}
```

5. **실시간 입찰 내역 탭 주석 해제**:
```typescript
// 탭 트리거와 TabsContent 주석 해제
<TabsTrigger value="bids">실시간 입찰 내역</TabsTrigger>
<TabsContent value="bids" className="mt-6">
  <RealtimeBidList bids={realtimeBids} maxItems={20} />
</TabsContent>
```

## 백엔드 웹소켓 서버 요구사항

### 필수 이벤트

#### 클라이언트 → 서버 (emit)
- `auction:join` - 경매 방 입장
  ```typescript
  { auctionId: number }
  ```

- `auction:leave` - 경매 방 퇴장
  ```typescript
  { auctionId: number }
  ```

- `bid:place` - 입찰하기
  ```typescript
  { auctionId: number, amount: number }
  ```

#### 서버 → 클라이언트 (on)
- `bid:placed` - 입찰 성공
  ```typescript
  {
    auctionId: number
    bidId: number
    amount: number
    bidder: UserResponse
    currentPrice: number
    createdAt: string
  }
  ```

- `auction:updated` - 경매 정보 업데이트
  ```typescript
  {
    auction: AuctionResponse
    updateType: 'price' | 'status' | 'time' | 'winner'
  }
  ```

- `bid:failed` - 입찰 실패
  ```typescript
  {
    auctionId: number
    reason: string
    code: 'INSUFFICIENT_BID' | 'AUCTION_ENDED' | 'INVALID_BID' | 'SERVER_ERROR'
  }
  ```

- `auction:ended` - 경매 종료
  ```typescript
  {
    auctionId: number
    winner: UserResponse | null
    finalPrice: number
  }
  ```

### 인증
웹소켓 연결 시 `auth.token`으로 JWT 토큰을 전달합니다:
```typescript
io(SOCKET_URL, {
  auth: {
    token: accessToken
  }
})
```

## 폴백 동작
- 웹소켓 연결 실패 시 자동으로 Mock API 사용
- `NEXT_PUBLIC_ENABLE_WEBSOCKET=false`로 설정하면 웹소켓 비활성화
- 사용자에게 투명하게 동작 (에러 표시 없음)

## 테스트 방법
1. 백엔드 웹소켓 서버 실행
2. 환경 변수 설정
3. 경매 상세 페이지 접속
4. 브라우저 개발자 도구 → Network → WS 탭에서 연결 확인
5. 여러 브라우저/탭에서 동시 접속하여 실시간 업데이트 확인

## 파일 구조
```
front/
├── src/
│   ├── hooks/
│   │   └── useAuctionSocket.ts      # 웹소켓 연결 관리 훅
│   ├── types/
│   │   └── websocket.ts              # 웹소켓 타입 정의
│   └── components/
│       └── realtime-bid-list.tsx     # 실시간 입찰 내역 컴포넌트
└── app/
    └── auction/
        └── [id]/
            └── page.tsx              # 경매 상세 페이지 (웹소켓 통합 준비됨)
```

## 주의사항
- 웹소켓 연결은 페이지 마운트 시 자동으로 시도됩니다
- 연결 실패 시 조용히 실패하고 Mock API를 사용합니다
- 여러 경매 페이지를 동시에 열면 각각 별도 연결을 가집니다
- 페이지를 떠날 때 자동으로 연결이 해제됩니다
