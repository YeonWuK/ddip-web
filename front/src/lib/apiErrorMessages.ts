/**
 * API 실패 시 클라이언트에 노출하는 메시지를 정제합니다.
 * 서버 스택, SQL, 내부 경로 등이 그대로 전달되지 않도록 합니다.
 */

const GENERIC_SERVER =
  "서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

const UNSAFE = [
  /(\s|^)at\s+[\w.$/]+/i,
  /Traceback/i,
  /Exception in thread/i,
  /\b(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN)\b[\s\w*]+/i,
  /Prisma\b/i,
  /node_modules/i,
  /Caused by:/i,
  /^\s*org\.[\w.]+/m,
  /:\d+:\d+/,
  /\\\\?\w+:\\\\/, // Windows path
  /\b0x[0-9a-f]{8,}\b/i,
]

const MAX_LEN = 240

function looksUnsafeToExpose(text: string): boolean {
  const t = text.trim()
  if (t.length > MAX_LEN) return true
  return UNSAFE.some((re) => re.test(t))
}

function firstMessageFromJson(raw: unknown): string | null {
  if (raw == null || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const candidates = [o.detail, o.message, o.error]
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim()
    if (Array.isArray(c) && typeof c[0] === "string" && c[0].trim()) {
      return c[0].trim()
    }
  }
  return null
}

/**
 * @param status HTTP 상태 코드
 * @param bodyText 응답 본문 (JSON 또는 텍스트)
 * @param clientDefault 4xx 등에서 쓰일 기본 메시지 (로그인 실패 등)
 */
export function toSafeApiErrorMessage(
  status: number,
  bodyText: string,
  clientDefault: string
): string {
  if (status >= 500) {
    return GENERIC_SERVER
  }

  if (!bodyText || !bodyText.trim()) {
    return clientDefault
  }

  let fromJson: string | null = null
  try {
    fromJson = firstMessageFromJson(JSON.parse(bodyText) as unknown)
  } catch {
    // not JSON; treat body as text below
  }

  const raw = fromJson ?? bodyText.trim()

  if (looksUnsafeToExpose(raw)) {
    return clientDefault
  }

  if (status >= 400 && status < 500) {
    return raw.length > 0 ? raw : clientDefault
  }

  return clientDefault
}
