/**
 * 금액을 한국어 단위로 자연스럽게 포맷팅
 * 예: 1000 → "1천", 10000 → "1만", 100000 → "10만", 1000000 → "100만", 10000000 → "1천만", 100000000 → "1억"
 */
export function formatAmountShort(amount: number): string {
  if (amount >= 100000000) {
    // 1억 이상
    const eok = Math.floor(amount / 100000000)
    const remainder = amount % 100000000
    if (remainder === 0) {
      return `${eok}억`
    }
    const man = Math.floor(remainder / 10000)
    if (man === 0) {
      return `${eok}억`
    }
    return `${eok}억 ${man}만`
  } else if (amount >= 10000) {
    // 1만 이상
    const man = Math.floor(amount / 10000)
    const remainder = amount % 10000
    if (remainder === 0) {
      return `${man}만`
    }
    // 나머지가 있으면 천 단위로 표시
    const cheon = Math.floor(remainder / 1000)
    if (cheon === 0) {
      return `${man}만`
    }
    return `${man}만 ${cheon}천`
  } else if (amount >= 1000) {
    // 1천 이상
    const cheon = Math.floor(amount / 1000)
    return `${cheon}천`
  } else {
    return amount.toString()
  }
}

/**
 * 금액 증가량을 버튼에 표시할 형식으로 포맷팅
 * 예: +1만, +10만, +1억
 */
export function formatIncrement(amount: number): string {
  return `+${formatAmountShort(amount)}`
}
