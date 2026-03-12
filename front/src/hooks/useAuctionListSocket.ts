"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import {
  SocketConnectionStatus,
  AuctionListBidUpdate,
  isAuctionListUpdate,
} from '@/src/types/websocket'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'
const LIST_TOPIC = '/topic/auction/list'

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
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected')
  const clientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<{ id: string; unsubscribe: () => void } | null>(null)
  const bidUpdateCallbackRef = useRef<((data: AuctionListBidUpdatePayload) => void) | null>(null)

  const handleMessage = useCallback((message: IMessage) => {
    try {
      const body = JSON.parse(message.body) as unknown
      if (isAuctionListUpdate(body)) {
        const payload: AuctionListBidUpdate = body
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

    setConnectionStatus('connecting')
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    client.onConnect = () => {
      setConnectionStatus('connected')
      const sub = client.subscribe(LIST_TOPIC, handleMessage)
      subscriptionRef.current = { id: sub.id, unsubscribe: sub.unsubscribe }
    }

    client.onStompError = () => {
      setConnectionStatus('error')
    }

    client.onWebSocketClose = () => {
      setConnectionStatus('disconnected')
    }

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      client.deactivate()
      clientRef.current = null
      setConnectionStatus('disconnected')
    }
  }, [handleMessage])

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
