"use client"

import { useEffect, useRef } from "react"
import { getWishlist } from "@/src/lib/wishlist"
import { auctionApi } from "@/src/services/api"
import { showAuctionNotificationIfNeeded } from "@/src/lib/auction-notifications"

/**
 * 찜한 경매의 상태를 주기적으로 체크하여 시작/종료 알림을 표시하는 hook
 */
export function useWishlistAuctionMonitor() {
  const previousStatusesRef = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const checkWishlistAuctions = async () => {
      try {
        const wishlist = getWishlist()
        const auctionItems = wishlist.filter(item => item.type === "auction")

        if (auctionItems.length === 0) {
          // 찜한 경매가 없으면 다음 체크 주기 설정
          timeoutId = setTimeout(checkWishlistAuctions, 60000) // 1분마다
          return
        }

        // 찜한 경매들의 상태를 체크
        for (const item of auctionItems) {
          try {
            const auction = await auctionApi.getAuction(item.id)
            const previousStatus = previousStatusesRef.current.get(item.id)
            
            // 상태가 변경되었는지 확인하고 알림 표시
            showAuctionNotificationIfNeeded(
              auction.id,
              auction.title,
              auction.status,
              previousStatus
            )
            
            // 현재 상태 저장
            previousStatusesRef.current.set(item.id, auction.status)
          } catch (error) {
            // 경매를 찾을 수 없거나 오류가 발생하면 무시
            console.error(`경매 ${item.id} 체크 실패:`, error)
          }
        }
      } catch (error) {
        console.error("찜한 경매 체크 실패:", error)
      }

      // 다음 체크 주기 설정 (1분마다)
      timeoutId = setTimeout(checkWishlistAuctions, 60000)
    }

    // 초기 체크
    checkWishlistAuctions()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])
}
