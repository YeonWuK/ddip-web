import { UserResponse } from "@/src/types/api"

/**
 * 사용자 아이디/닉네임을 마스킹 처리
 * 예: "user123" → "us***23", "닉네임123" → "닉네***23"
 */
export function maskUserId(user: UserResponse): string {
  const displayName = user.nickname || user.name || user.email || "익명"
  
  // 너무 짧으면 그대로 반환
  if (displayName.length <= 3) {
    return displayName
  }
  
  // 앞 2글자 + *** + 뒤 2글자
  const prefix = displayName.slice(0, 2)
  const suffix = displayName.slice(-2)
  return `${prefix}***${suffix}`
}

/**
 * 상대 시간 포맷팅 (예: "방금 전", "5분 전", "1시간 전")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) {
    return "방금 전"
  } else if (diffMin < 60) {
    return `${diffMin}분 전`
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`
  } else if (diffDay < 7) {
    return `${diffDay}일 전`
  } else {
    // 7일 이상이면 날짜로 표시
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}
