/**
 * 웹소켓 실시간 경매 관련 타입 정의
 * 백엔드 Spring WebSocket(STOMP) - /topic/auction/{auctionId}
 */

import { UserResponse } from './api'

/**
 * BidsResponseDto - 웹소켓 입찰 수신
 */
export interface WebSocketBidEvent {
  id: number
  creationDate: string
  user: UserResponse
  auctionId: number
  price: number
}

/**
 * AuctionEndedEventDto - 웹소켓 경매 종료 수신
 */
export interface AuctionEndedEventDto {
  auctionId: number
  title: string
  auctionStatus: 'RUNNING' | 'ENDED' | 'CANCELED'
  user: UserResponse | null
  currentPrice: number
  endAt: string
}

/**
 * 토픽에서 수신하는 메시지 타입 (payload로 구분)
 */
export type AuctionTopicMessage = WebSocketBidEvent | AuctionEndedEventDto

/**
 * WebSocketBidEvent 여부 확인
 */
export function isBidEvent(msg: unknown): msg is WebSocketBidEvent {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'price' in msg &&
    'creationDate' in msg &&
    'user' in msg
  )
}

/**
 * AuctionEndedEventDto 여부 확인
 */
export function isAuctionEndedEvent(msg: unknown): msg is AuctionEndedEventDto {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'auctionStatus' in msg &&
    'endAt' in msg &&
    'title' in msg
  )
}

/**
 * 웹소켓 연결 상태
 */
export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * 웹소켓 훅 반환 타입
 */
export interface UseAuctionSocketReturn {
  isConnected: boolean
  connectionStatus: SocketConnectionStatus
  joinAuction: (auctionId: number) => void
  leaveAuction: (auctionId: number) => void
  onBidPlaced: (callback: (data: WebSocketBidEvent) => void) => () => void
  onAuctionEnded: (callback: (data: AuctionEndedEventDto) => void) => () => void
  disconnect: () => void
}
