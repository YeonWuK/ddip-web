"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { tokenStorage } from '@/src/lib/auth'
import {
  UseAuctionSocketReturn,
  SocketConnectionStatus,
  BidPlacedEvent,
  AuctionUpdatedEvent,
  BidFailedEvent,
  AuctionEndedEvent,
} from '@/src/types/websocket'

/**
 * 웹소켓 서버 URL (환경 변수 또는 기본값)
 * 백엔드 준비되면 환경 변수로 설정
 */
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

/**
 * 실시간 경매 웹소켓 연결 관리 훅
 * 
 * @example
 * const { isConnected, joinAuction, placeBid, onBidPlaced } = useAuctionSocket()
 * 
 * useEffect(() => {
 *   joinAuction(auctionId)
 *   onBidPlaced((data) => {
 *     console.log('새 입찰:', data)
 *     setAuction(prev => ({ ...prev, currentPrice: data.currentPrice }))
 *   })
 * }, [auctionId])
 */
export function useAuctionSocket(): UseAuctionSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected')
  
  // 이벤트 리스너 참조 저장 (cleanup을 위해)
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map())

  // 소켓 초기화
  useEffect(() => {
    // 백엔드가 준비되지 않았으면 소켓 연결하지 않음
    // 환경 변수로 제어 가능
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'false') return
    const token = tokenStorage.getAccessToken()
    if (!token) return
    setConnectionStatus('connecting')

    // 소켓 연결 (인증 토큰 포함)
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => setConnectionStatus('connected'))
    newSocket.on('disconnect', () => setConnectionStatus('disconnected'))
    newSocket.on('connect_error', () => {
      setConnectionStatus('error')
      // 백엔드가 준비되지 않았을 때는 조용히 실패 (에러 표시 안 함)
    })

    setSocket(newSocket)

    // cleanup
    return () => {
      newSocket.close()
      setSocket(null)
      setConnectionStatus('disconnected')
    }
  }, [])

  /**
   * 경매 방 입장
   */
  const joinAuction = useCallback((auctionId: number) => {
    if (!socket || !socket.connected) return
    socket.emit('auction:join', { auctionId })
  }, [socket])

  /**
   * 경매 방 퇴장
   */
  const leaveAuction = useCallback((auctionId: number) => {
    if (!socket || !socket.connected) return
    socket.emit('auction:leave', { auctionId })
  }, [socket])

  /**
   * 입찰하기
   */
  const placeBid = useCallback((auctionId: number, amount: number) => {
    if (!socket || !socket.connected) return
    socket.emit('bid:place', { auctionId, amount })
  }, [socket])

  /**
   * 입찰 성공 이벤트 리스너 등록
   */
  const onBidPlaced = useCallback((callback: (data: BidPlacedEvent) => void) => {
    if (!socket) return

    const eventName = 'bid:placed'
    socket.on(eventName, callback)

    // 리스너 추적 (cleanup용)
    if (!eventListenersRef.current.has(eventName)) {
      eventListenersRef.current.set(eventName, new Set())
    }
    eventListenersRef.current.get(eventName)?.add(callback)

    // cleanup 함수 반환
    return () => {
      socket.off(eventName, callback)
      eventListenersRef.current.get(eventName)?.delete(callback)
    }
  }, [socket])

  /**
   * 경매 업데이트 이벤트 리스너 등록
   */
  const onAuctionUpdated = useCallback((callback: (data: AuctionUpdatedEvent) => void) => {
    if (!socket) return

    const eventName = 'auction:updated'
    socket.on(eventName, callback)

    if (!eventListenersRef.current.has(eventName)) {
      eventListenersRef.current.set(eventName, new Set())
    }
    eventListenersRef.current.get(eventName)?.add(callback)

    return () => {
      socket.off(eventName, callback)
      eventListenersRef.current.get(eventName)?.delete(callback)
    }
  }, [socket])

  /**
   * 입찰 실패 이벤트 리스너 등록
   */
  const onBidFailed = useCallback((callback: (data: BidFailedEvent) => void) => {
    if (!socket) return

    const eventName = 'bid:failed'
    socket.on(eventName, callback)

    if (!eventListenersRef.current.has(eventName)) {
      eventListenersRef.current.set(eventName, new Set())
    }
    eventListenersRef.current.get(eventName)?.add(callback)

    return () => {
      socket.off(eventName, callback)
      eventListenersRef.current.get(eventName)?.delete(callback)
    }
  }, [socket])

  /**
   * 경매 종료 이벤트 리스너 등록
   */
  const onAuctionEnded = useCallback((callback: (data: AuctionEndedEvent) => void) => {
    if (!socket) return

    const eventName = 'auction:ended'
    socket.on(eventName, callback)

    if (!eventListenersRef.current.has(eventName)) {
      eventListenersRef.current.set(eventName, new Set())
    }
    eventListenersRef.current.get(eventName)?.add(callback)

    return () => {
      socket.off(eventName, callback)
      eventListenersRef.current.get(eventName)?.delete(callback)
    }
  }, [socket])

  /**
   * 소켓 연결 해제
   */
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setConnectionStatus('disconnected')
    }
  }, [socket])

  return {
    socket,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    joinAuction,
    leaveAuction,
    placeBid,
    onBidPlaced,
    onAuctionUpdated,
    onBidFailed,
    onAuctionEnded,
    disconnect,
  }
}
