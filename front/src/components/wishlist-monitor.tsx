"use client"

import { useWishlistAuctionMonitor } from "@/src/hooks/useWishlistAuctionMonitor"

/**
 * 찜한 경매를 모니터링하는 컴포넌트
 * 전역적으로 찜한 경매의 시작/종료를 체크하여 알림을 표시합니다.
 */
export function WishlistMonitor() {
  useWishlistAuctionMonitor()
  return null // UI를 렌더링하지 않음
}
