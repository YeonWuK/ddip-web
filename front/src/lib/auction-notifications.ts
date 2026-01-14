/**
 * 경매 알림 관련 유틸리티
 * 재사용 가능한 알림 메시지 생성 함수
 */

import { toast } from "sonner"

/**
 * 경매 시작 알림 표시
 */
export function notifyAuctionStarted(auctionTitle: string) {
  toast.info(`${auctionTitle} 경매가 시작되었습니다`, {
    duration: 5000,
  })
}

/**
 * 경매 종료 알림 표시
 */
export function notifyAuctionEnded(auctionTitle: string) {
  toast.info(`${auctionTitle} 경매가 종료되었습니다`, {
    duration: 5000,
  })
}

/**
 * 알림 표시 여부를 추적하기 위한 키 생성
 */
export function getNotificationKey(auctionId: number, type: "started" | "ended"): string {
  return `auction_notification_${auctionId}_${type}`
}

/**
 * 알림이 이미 표시되었는지 확인
 */
export function hasNotificationBeenShown(auctionId: number, type: "started" | "ended"): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const key = getNotificationKey(auctionId, type)
    return localStorage.getItem(key) === "true"
  } catch (error) {
    console.error("알림 상태 확인 실패:", error)
    return false
  }
}

/**
 * 알림 표시 여부를 저장
 */
export function markNotificationAsShown(auctionId: number, type: "started" | "ended"): void {
  if (typeof window === "undefined") return
  
  try {
    const key = getNotificationKey(auctionId, type)
    localStorage.setItem(key, "true")
  } catch (error) {
    console.error("알림 상태 저장 실패:", error)
  }
}

/**
 * 알림 표시 (중복 방지 포함)
 */
export function showAuctionNotificationIfNeeded(
  auctionId: number,
  auctionTitle: string,
  status: "SCHEDULED" | "RUNNING" | "ENDED" | "CANCELED",
  previousStatus?: string
): void {
  // 상태가 변경되지 않았으면 알림 표시 안 함
  if (previousStatus === status) return
  
  // SCHEDULED -> RUNNING 또는 다른 상태 -> RUNNING으로 변경된 경우
  if (status === "RUNNING" && previousStatus !== "RUNNING") {
    if (!hasNotificationBeenShown(auctionId, "started")) {
      notifyAuctionStarted(auctionTitle)
      markNotificationAsShown(auctionId, "started")
    }
  } 
  // RUNNING -> ENDED로 변경된 경우
  else if (status === "ENDED" && previousStatus !== "ENDED") {
    if (!hasNotificationBeenShown(auctionId, "ended")) {
      notifyAuctionEnded(auctionTitle)
      markNotificationAsShown(auctionId, "ended")
    }
  }
}
