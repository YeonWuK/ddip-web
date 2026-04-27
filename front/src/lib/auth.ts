// 액세스 토큰은 JS가 읽을 수 있는 저장소에 두지 않습니다(메모리만 사용).
// XSS 시에도 refresh/PII를 localStorage에 두지 않도록 이전 키는 정리합니다.

const LEGACY_ACCESS_TOKEN_KEY = "ddip_access_token"
const LEGACY_REFRESH_TOKEN_KEY = "ddip_refresh_token"
const LEGACY_USER_KEY = "ddip_user"

let memoryAccessToken: string | null = null
let legacyMigrated = false

function cleanToken(token: string): string {
  return token.trim().replace(/^["']|["']$/g, "")
}

function migrateLegacyLocalStorageOnce(): void {
  if (typeof window === "undefined" || legacyMigrated) return
  legacyMigrated = true
  try {
    const legacyAccess = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
    if (legacyAccess) {
      memoryAccessToken = cleanToken(legacyAccess)
    }
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {
    // 저장소 접근 불가 시 무시
  }
}

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null
    migrateLegacyLocalStorageOnce()
    return memoryAccessToken
  },

  setAccessToken: (token: string): void => {
    if (typeof window === "undefined") return
    migrateLegacyLocalStorageOnce()
    memoryAccessToken = cleanToken(token)
  },

  removeAccessToken: (): void => {
    if (typeof window === "undefined") return
    memoryAccessToken = null
  },

  clearAll: (): void => {
    if (typeof window === "undefined") return
    memoryAccessToken = null
    try {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
      localStorage.removeItem(LEGACY_USER_KEY)
    } catch {
      // ignore
    }
  },
}
