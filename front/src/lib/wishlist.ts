/**
 * 위시리스트 관리 유틸리티
 * localStorage를 사용하여 사용자별 위시리스트 저장
 */

const WISHLIST_STORAGE_KEY = "ddip_wishlist"

export interface WishlistItem {
  id: number
  type: "project" | "auction"
  addedAt: string
}

/**
 * 현재 사용자의 위시리스트 가져오기
 */
export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as WishlistItem[]
    }
  } catch (error) {
    console.error("위시리스트 로드 실패:", error)
  }
  
  return []
}

/**
 * 위시리스트에 항목 추가
 */
export function addToWishlist(id: number, type: "project" | "auction"): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const wishlist = getWishlist()
    
    // 이미 있는지 확인
    if (wishlist.some(item => item.id === id && item.type === type)) {
      return false // 이미 있음
    }
    
    wishlist.push({
      id,
      type,
      addedAt: new Date().toISOString(),
    })
    
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
    return true
  } catch (error) {
    console.error("위시리스트 추가 실패:", error)
    return false
  }
}

/**
 * 위시리스트에서 항목 제거
 */
export function removeFromWishlist(id: number, type: "project" | "auction"): boolean {
  if (typeof window === "undefined") return false
  
  try {
    const wishlist = getWishlist()
    const filtered = wishlist.filter(
      item => !(item.id === id && item.type === type)
    )
    
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error("위시리스트 제거 실패:", error)
    return false
  }
}

/**
 * 위시리스트에 있는지 확인
 */
export function isInWishlist(id: number, type: "project" | "auction"): boolean {
  const wishlist = getWishlist()
  return wishlist.some(item => item.id === id && item.type === type)
}

/**
 * 위시리스트 토글 (있으면 제거, 없으면 추가)
 */
export function toggleWishlist(id: number, type: "project" | "auction"): boolean {
  if (isInWishlist(id, type)) {
    return removeFromWishlist(id, type)
  } else {
    return addToWishlist(id, type)
  }
}
