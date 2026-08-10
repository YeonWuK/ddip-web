"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import {
  SocketConnectionStatus,
  AuctionListBidUpdate,
  AuctionListBidUpdateEnvelope,
  isAuctionListUpdate,
} from '@/src/types/websocket'
import { useAuth } from '@/src/contexts/auth-context'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
const LIST_TOPIC = '/topic/auction/list'
const MAX_RECONNECT_ATTEMPTS = 5

export interface AuctionListBidUpdatePayload {
  auctionId: number
  price: number
  bidCount?: number
}

export interface UseAuctionListSocketReturn {
  isConnected: boolean
  connectionStatus: SocketConnectionStatus
  onBidUpdate: (callback: (data: AuctionListBidUpdatePayload) => void) => () => void
}

/**
 * 경매 리스트 웹소켓 훅 (STOMP)
 * - 연결: ws://localhost:8080/ws
 * - 구독: /topic/auction/list
 * - 메인/경매 목록 화면에서 입찰가 실시간 업데이트 수신
 */
export function useAuctionListSocket(): UseAuctionListSocketReturn {
  const { isAuthenticated, isLoading } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<{ id: string; unsubscribe: () => void } | null>(null)
  const bidUpdateCallbackRef = useRef<((data: AuctionListBidUpdatePayload) => void) | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const handleMessage = useCallback((message: IMessage) => {
    try {
      const body = JSON.parse(message.body) as unknown
      if (isAuctionListUpdate(body)) {
        const raw = body as AuctionListBidUpdate | AuctionListBidUpdateEnvelope
        const payload: AuctionListBidUpdate = {
          auctionId:
            (raw as AuctionListBidUpdate).auctionId ??
            (raw as AuctionListBidUpdateEnvelope).auctionResponseDto?.auctionId ??
            (raw as AuctionListBidUpdateEnvelope).bidsResponseDto?.auctionId ??
            0,
          price:
            (raw as AuctionListBidUpdate).price ??
            (raw as AuctionListBidUpdate).currentPrice ??
            (raw as AuctionListBidUpdateEnvelope).auctionResponseDto?.currentPrice ??
            (raw as AuctionListBidUpdateEnvelope).bidsResponseDto?.price ??
            0,
          bidCount:
            (raw as AuctionListBidUpdate).bidCount ??
            (raw as AuctionListBidUpdateEnvelope).auctionResponseDto?.bidCount,
        }
        bidUpdateCallbackRef.current?.({
          auctionId: payload.auctionId,
          price: payload.price,
          bidCount: payload.bidCount,
        })
      }
    } catch {
      // ignore parse errors
    }
  }, [])

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
      const sub = client.subscribe(LIST_TOPIC, handleMessage)
      subscriptionRef.current = { id: sub.id, unsubscribe: sub.unsubscribe }
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
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      client.deactivate()
      clientRef.current = null
      reconnectAttemptsRef.current = 0
      setConnectionStatus('disconnected')
    }
  }, [handleMessage, isAuthenticated, isLoading])

  const onBidUpdate = useCallback((callback: (data: AuctionListBidUpdatePayload) => void) => {
    bidUpdateCallbackRef.current = callback
    return () => {
      bidUpdateCallbackRef.current = null
    }
  }, [])

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    onBidUpdate,
  }
}
