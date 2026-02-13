/**
 * API 클라이언트 - 백엔드와의 통신을 담당하는 기본 HTTP 클라이언트
 * 모든 API 요청은 이 클라이언트를 통해 처리됩니다.
 */

import { tokenStorage } from '@/src/lib/auth';

// 백엔드 API 기본 URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * API 요청 헬퍼 함수
 * 모든 API 요청에 대한 공통 처리를 담당합니다.
 * - 인증 토큰 자동 추가
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
  const token = tokenStorage.getAccessToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  // FormData 사용 시 Content-Type은 브라우저가 boundary 포함해 설정하므로 제거
  if (isFormData && 'Content-Type' in headers) delete headers['Content-Type'];

  if (token) {
    // 토큰 앞뒤 공백 제거 및 Bearer 형식 확인
    const cleanToken = token.trim().replace(/^["']|["']$/g, ''); // 앞뒤 따옴표 제거
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // refreshToken 쿠키 저장을 위해 필수
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = '요청 처리 중 오류가 발생했습니다';
    let errorJson: any = null;
    
    try {
      errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`${errorMessage} (${response.status})`);
  }

  // DELETE 요청 등은 응답 본문이 없거나 plain text일 수 있음 (예: "Deleted auction Successfully3")
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }
  try {
    const responseData = JSON.parse(text);
    return responseData as T;
  } catch {
    // 백엔드가 JSON이 아닌 문자열만 반환한 경우 (200 OK면 성공으로 간주)
    return {} as T;
  }
}
