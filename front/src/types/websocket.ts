/**
 * 웹소켓 실시간 경매 관련 타입 정의
 */

import { AuctionResponse, UserResponse } from './api'

/**
 * 웹소켓 이벤트 타입
 */
export type AuctionSocketEvent =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'auction:joined'
  | 'auction:left'
  | 'auction:updated'
  | 'bid:placed'
  | 'bid:failed'
  | 'auction:ended'

/**
 * 입찰 성공 이벤트 데이터
 */
export interface BidPlacedEvent {
  auctionId: number
  bidId: number
  amount: number
  bidder: UserResponse
  currentPrice: number
  createdAt: string
}

/**
 * 경매 업데이트 이벤트 데이터
 */
export interface AuctionUpdatedEvent {
  auction: AuctionResponse
  updateType: 'price' | 'status' | 'time' | 'winner'
}

/**
 * 입찰 실패 이벤트 데이터
 */
export interface BidFailedEvent {
  auctionId: number
  reason: string
  code: 'INSUFFICIENT_BID' | 'AUCTION_ENDED' | 'INVALID_BID' | 'SERVER_ERROR'
}

/**
 * 경매 종료 이벤트 데이터
 */
export interface AuctionEndedEvent {
  auctionId: number
  winner: UserResponse | null
  finalPrice: number
}

/**
 * 웹소켓 연결 상태
 */
export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * 웹소켓 훅 반환 타입
 */
export interface UseAuctionSocketReturn {
  socket: any | null // socket.io-client Socket 타입
  isConnected: boolean
  connectionStatus: SocketConnectionStatus
  joinAuction: (auctionId: number) => void
  leaveAuction: (auctionId: number) => void
  placeBid: (auctionId: number, amount: number) => void
  onBidPlaced: (callback: (data: BidPlacedEvent) => void) => void
  onAuctionUpdated: (callback: (data: AuctionUpdatedEvent) => void) => void
  onBidFailed: (callback: (data: BidFailedEvent) => void) => void
  onAuctionEnded: (callback: (data: AuctionEndedEvent) => void) => void
  disconnect: () => void
}
