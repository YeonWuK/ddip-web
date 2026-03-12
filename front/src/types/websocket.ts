/**
 * 웹소켓 실시간 경매 관련 타입 정의
 * 백엔드 Spring WebSocket(STOMP) - /topic/auction/{auctionId}
 */

import { UserResponse } from './api'

/**
 * BidsResponseDto - 웹소켓 입찰 수신 (bidsResponseDto 내부)
 */
export interface WebSocketBidEvent {
  id: number
  creationDate: string
  user: UserResponse
  auctionId: number
  price: number
}

/**
 * AuctionUpdateEventDto - 웹소켓으로 실제 수신하는 메시지
 * { auctionResponseDto: {...}, bidsResponseDto: {...} }
 */
export interface AuctionUpdateWsMessage {
  auctionResponseDto: {
    auctionId?: number
    currentPrice?: number
    auctionStatus?: 'RUNNING' | 'ENDED' | 'CANCELED'
  }
  bidsResponseDto: WebSocketBidEvent
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
 * AuctionUpdateWsMessage 여부 확인 (백엔드 AuctionUpdateEventDto 구조)
 */
export function isBidEvent(msg: unknown): msg is AuctionUpdateWsMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'auctionResponseDto' in msg &&
    'bidsResponseDto' in msg
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
 * AuctionListBidUpdate - /topic/auction/list 입찰가 업데이트 DTO
 * (WebSocketBidEvent와 동일 구조일 수 있음 - auctionId, price 필수)
 */
export interface AuctionListBidUpdate {
  auctionId: number
  price: number
  currentPrice?: number
  bidCount?: number
}

/**
 * /topic/auction/list가 AuctionUpdateEventDto 형태를 보낼 때의 래퍼
 */
export interface AuctionListBidUpdateEnvelope {
  auctionResponseDto?: {
    auctionId?: number
    currentPrice?: number
    bidCount?: number
  }
  bidsResponseDto?: {
    auctionId?: number
    price?: number
  }
}

/**
 * /topic/auction/list 입찰 업데이트 수신 여부 확인
 * WebSocketBidEvent 또는 AuctionListBidUpdate 형태 모두 수용
 */
export function isAuctionListUpdate(msg: unknown): msg is AuctionListBidUpdate {
  if (typeof msg !== 'object' || msg === null) return false
  const direct = msg as { auctionId?: unknown; price?: unknown; currentPrice?: unknown }
  const directPrice = direct.price ?? direct.currentPrice
  if (typeof direct.auctionId === 'number' && typeof directPrice === 'number') {
    return true
  }

  const wrapped = msg as AuctionListBidUpdateEnvelope
  const wrappedAuctionId = wrapped.auctionResponseDto?.auctionId ?? wrapped.bidsResponseDto?.auctionId
  const wrappedPrice = wrapped.auctionResponseDto?.currentPrice ?? wrapped.bidsResponseDto?.price
  return typeof wrappedAuctionId === 'number' && typeof wrappedPrice === 'number'
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
  onBidPlaced: (callback: (data: AuctionUpdateWsMessage) => void) => () => void
  onAuctionEnded: (callback: (data: AuctionEndedEventDto) => void) => () => void
  disconnect: () => void
}
