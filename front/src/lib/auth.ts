// 액세스 토큰은 JS가 읽을 수 있는 저장소에 두지 않습니다(메모리만 사용).
// XSS 시에도 refresh/PII를 localStorage에 두지 않도록 이전 키는 정리합니다.

const LEGACY_ACCESS_TOKEN_KEY = "ddip_access_token"
const LEGACY_REFRESH_TOKEN_KEY = "ddip_refresh_token"
const LEGACY_USER_KEY = "ddip_user"
/** HttpOnly refresh 쿠키 존재 여부를 JS에서 알 수 없어, 로그인 성공 시에만 설정 */
const REFRESH_SESSION_HINT_KEY = "ddip_refresh_session_hint"
/** 비로그인 최초 방문과 기존 세션 복구를 구분하기 위한 1회성 probe 플래그 */
const REFRESH_BOOTSTRAP_PROBE_KEY = "ddip_refresh_bootstrap_probe"

let memoryAccessToken: string | null = null
let legacyMigrated = false

function cleanToken(token: string): string {
  return token.trim().replace(/^["']|["']$/g, "")
}

function markRefreshSessionHint(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(REFRESH_SESSION_HINT_KEY, "1")
  } catch {
    // ignore
  }
}

function clearRefreshSessionHint(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(REFRESH_SESSION_HINT_KEY)
  } catch {
    // ignore
  }
}

function markRefreshBootstrapProbed(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(REFRESH_BOOTSTRAP_PROBE_KEY, "1")
  } catch {
    // ignore
  }
}

function clearRefreshBootstrapProbe(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(REFRESH_BOOTSTRAP_PROBE_KEY)
  } catch {
    // ignore
  }
}

/** refresh-token API 호출 가능 여부 (비로그인 최초 방문 시 불필요한 401 방지) */
export function hasRefreshSessionHint(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(REFRESH_SESSION_HINT_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * 초기 세션 복구용 refresh 시도 가능 여부.
 * - 로그인 이력(hint)이 있으면 항상 시도
 * - hint 없으면 세션당 1회만 probe (기존 HttpOnly 쿠키 복구 + 비로그인 401 최소화)
 */
export function canAttemptRefreshBootstrap(): boolean {
  if (hasRefreshSessionHint()) return true
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(REFRESH_BOOTSTRAP_PROBE_KEY) !== "1"
  } catch {
    return false
  }
}

function migrateLegacyLocalStorageOnce(): void {
  if (typeof window === "undefined" || legacyMigrated) return
  legacyMigrated = true
  try {
    const legacyAccess = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
    const legacyRefresh = localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
    if (legacyAccess) {
      memoryAccessToken = cleanToken(legacyAccess)
    }
    if (legacyAccess || legacyRefresh) {
      markRefreshSessionHint()
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
    markRefreshSessionHint()
    clearRefreshBootstrapProbe()
  },

  removeAccessToken: (): void => {
    if (typeof window === "undefined") return
    memoryAccessToken = null
  },

  clearAll: (): void => {
    if (typeof window === "undefined") return
    memoryAccessToken = null
    clearRefreshSessionHint()
    markRefreshBootstrapProbed()
    try {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
      localStorage.removeItem(LEGACY_USER_KEY)
    } catch {
      // ignore
    }
  },
}
