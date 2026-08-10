"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import {
  UseAuctionSocketReturn,
  SocketConnectionStatus,
  AuctionUpdateWsMessage,
  AuctionEndedEventDto,
  isBidEvent,
  isAuctionEndedEvent,
} from '@/src/types/websocket'
import { useAuth } from '@/src/contexts/auth-context'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * 실시간 경매 웹소켓 훅 (STOMP)
 * - 연결: ws://localhost:8080/ws
 * - 구독: /topic/auction/{auctionId}
 * - 입찰: REST API 사용 (auctionApi.placeBid)
 */
export function useAuctionSocket(): UseAuctionSocketReturn {
  const { isAuthenticated, isLoading } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<{ id: string; unsubscribe: () => void } | null>(null)
  const currentAuctionIdRef = useRef<number | null>(null)
  const pendingAuctionIdRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const bidCallbackRef = useRef<((data: AuctionUpdateWsMessage) => void) | null>(null)
  const endedCallbackRef = useRef<((data: AuctionEndedEventDto) => void) | null>(null)

  const handleMessage = useCallback((message: IMessage) => {
    try {
      const body = JSON.parse(message.body) as unknown
      if (isBidEvent(body)) {
        bidCallbackRef.current?.(body)
      } else if (isAuctionEndedEvent(body)) {
        endedCallbackRef.current?.(body)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // STOMP 클라이언트 연결
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'false') return
    if (isLoading || !isAuthenticated) return

    setConnectionStatus('connecting')
    reconnectAttemptsRef.current = 0
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    const stopReconnect = () => {
      client.reconnectDelay = 0
      client.deactivate()
    }

    client.onConnect = () => {
      reconnectAttemptsRef.current = 0
      setConnectionStatus('connected')
      const pid = pendingAuctionIdRef.current
      if (pid !== null) {
        pendingAuctionIdRef.current = null
        leaveAuction()
        currentAuctionIdRef.current = pid
        const sub = client.subscribe(`/topic/auction/${pid}`, handleMessage)
        subscriptionRef.current = { id: sub.id, unsubscribe: sub.unsubscribe }
      }
    }

    client.onStompError = () => {
      setConnectionStatus('error')
    }

    client.onWebSocketClose = () => {
      setConnectionStatus('disconnected')
      reconnectAttemptsRef.current += 1
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        stopReconnect()
      }
    }

    client.activate()
    clientRef.current = client

    return () => {
      pendingAuctionIdRef.current = null
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      currentAuctionIdRef.current = null
      client.deactivate()
      clientRef.current = null
      reconnectAttemptsRef.current = 0
      setConnectionStatus('disconnected')
    }
  }, [isAuthenticated, isLoading])

  /** 구독 해제 (leave) - auctionId는 호환용, 현재 구독만 해제 */
  const leaveAuction = useCallback((_auctionId?: number) => {
    pendingAuctionIdRef.current = null
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
    currentAuctionIdRef.current = null
  }, [])

  /** 경매 구독 (join) - 연결 전 호출 시 대기 후 onConnect에서 구독 */
  const joinAuction = useCallback(
    (auctionId: number) => {
      const client = clientRef.current
      if (!client) return

      if (!client.connected) {
        pendingAuctionIdRef.current = auctionId
        return
      }

      leaveAuction()
      currentAuctionIdRef.current = auctionId
      const sub = client.subscribe(`/topic/auction/${auctionId}`, handleMessage)
      subscriptionRef.current = { id: sub.id, unsubscribe: sub.unsubscribe }
    },
    [handleMessage, leaveAuction]
  )

  /** 입찰 수신 콜백 등록 */
  const onBidPlaced = useCallback((callback: (data: AuctionUpdateWsMessage) => void) => {
    bidCallbackRef.current = callback
    return () => {
      bidCallbackRef.current = null
    }
  }, [])

  /** 경매 종료 수신 콜백 등록 */
  const onAuctionEnded = useCallback((callback: (data: AuctionEndedEventDto) => void) => {
    endedCallbackRef.current = callback
    return () => {
      endedCallbackRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    pendingAuctionIdRef.current = null
    leaveAuction()
    clientRef.current?.deactivate()
    clientRef.current = null
    setConnectionStatus('disconnected')
  }, [leaveAuction])

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    joinAuction,
    leaveAuction,
    onBidPlaced,
    onAuctionEnded,
    disconnect,
  }
}
