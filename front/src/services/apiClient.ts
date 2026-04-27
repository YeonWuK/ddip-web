/**
 * API 클라이언트 - 백엔드와의 통신을 담당하는 기본 HTTP 클라이언트
 * 모든 API 요청은 이 클라이언트를 통해 처리됩니다.
 * - 401 발생 시 refresh-token으로 액세스 토큰 자동 갱신 후 재시도
 */

import { tokenStorage } from "@/src/lib/auth"
import { toSafeApiErrorMessage } from "@/src/lib/apiErrorMessages"

// 백엔드 API 기본 URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const REFRESH_TOKEN_ENDPOINT = "/api/users/refresh-token"
const DEFAULT_CLIENT_ERROR = "요청 처리 중 오류가 발생했습니다"

/** 동시 401 발생 시 하나의 refresh만 수행하기 위한 lock */
let refreshPromise: Promise<string | null> | null = null

type RefreshMode = "forBootstrap" | "forRetry"

/**
 * refresh 쿠키( HttpOnly )로 새 액세스 토큰 발급. credentials: 'include'로 쿠키 전송.
 * forBootstrap: 초기 복구용 — 실패 시 null만 반환(throw 없음).
 * forRetry: 401 대응 — 파싱/서버 오류 시 예외, 기존과 동일하게 clearAll 후 throw.
 */
async function runAccessTokenRefresh(
  mode: RefreshMode
): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}${REFRESH_TOKEN_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  if (response.status === 401) {
    tokenStorage.clearAll()
    return null
  }

  if (!response.ok) {
    if (mode === "forBootstrap") return null
    throw new Error(`토큰 갱신 실패 (${response.status})`)
  }

  const text = await response.text()
  let data: {
    newAccessToken?: string
    access_token?: string
    accessToken?: string
  } = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    if (mode === "forBootstrap") return null
    throw new Error("토큰 갱신 응답 파싱 실패")
  }

  const newToken = data.newAccessToken || data.access_token || data.accessToken
  if (!newToken) {
    if (mode === "forBootstrap") return null
    throw new Error("토큰 갱신 응답에 액세스 토큰이 없습니다")
  }

  tokenStorage.setAccessToken(newToken)
  return newToken
}

/**
 * 새로고침 직후 메모리에 액세스 토큰이 없을 때, HttpOnly refresh 쿠키만으로 복구 시도.
 * 실패 시 null (로그인 필요).
 */
export async function tryRestoreAccessTokenFromRefreshCookie(): Promise<string | null> {
  try {
    return await runAccessTokenRefresh("forBootstrap")
  } catch {
    return null
  }
}

/**
 * 401 이후 refresh-token 호출
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    return await runAccessTokenRefresh("forRetry")
  } catch (e) {
    tokenStorage.clearAll()
    throw e
  }
}

/**
 * refresh-token 호출 (동시 다중 401 시 하나만 수행)
 */
async function ensureRefreshedToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

function throwForFailedResponse(
  response: Response,
  errorText: string,
  endpoint: string
): never {
  const defaultMsg = DEFAULT_CLIENT_ERROR
  const safe = toSafeApiErrorMessage(response.status, errorText, defaultMsg)

  const isExpectedOAuthFlow =
    response.status === 403 && endpoint.startsWith("/api/users/profile")
  if (!isExpectedOAuthFlow) {
    let errorJson: unknown = null
    try {
      errorJson = JSON.parse(errorText)
    } catch {
      // ignore
    }
    console.error(`[apiClient] ${response.status} ${endpoint}:`, errorJson ?? errorText)
  }

  throw new Error(`${safe} (${response.status})`)
}

/**
 * API 요청 헬퍼 함수
 * 모든 API 요청에 대한 공통 처리를 담당합니다.
 * - 인증 토큰 자동 추가
 * - 401 시 자동 토큰 갱신 후 재시도
 * - 에러 처리
 * - JSON/FormData 자동 처리
 *
 * @param endpoint - API 엔드포인트 (예: '/api/users/me')
 * @param options - fetch 옵션
 * @returns API 응답 데이터
 * @throws Error - API 요청 실패 시
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getAccessToken()
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }
  if (isFormData && "Content-Type" in headers) delete headers["Content-Type"]

  if (token) {
    const cleanToken = token.trim().replace(/^["']|["']$/g, "")
    headers["Authorization"] = `Bearer ${cleanToken}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  })

  // 401: 액세스 토큰 만료 → refresh 후 1회만 재시도
  if (response.status === 401 && !endpoint.includes(REFRESH_TOKEN_ENDPOINT)) {
    const newToken = await ensureRefreshedToken()
    if (newToken) {
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      }
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      })
      if (retryResponse.ok) {
        return handleSuccessResponse<T>(retryResponse)
      }
      const errorText = await retryResponse.text()
      throwForFailedResponse(retryResponse, errorText, endpoint)
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"))
    }
    throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.")
  }

  if (!response.ok) {
    const errorText = await response.text()
    throwForFailedResponse(response, errorText, endpoint)
  }

  return handleSuccessResponse<T>(response)
}

async function handleSuccessResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T
  }

  const text = await response.text()
  if (!text || text.trim() === "") {
    return {} as T
  }
  try {
    const responseData = JSON.parse(text)
    return responseData as T
  } catch {
    return {} as T
  }
}
