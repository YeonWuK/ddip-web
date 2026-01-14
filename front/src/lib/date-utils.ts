/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜 문자열을 Date 객체로 안전하게 파싱
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 유효한 Date 객체 또는 null
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 날짜가 유효한지 확인
 * @param date Date 객체
 * @returns 유효한 날짜인지 여부
 */
export function isValidDate(date: Date | null): date is Date {
  return date !== null && !isNaN(date.getTime());
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param dateString ISO 형식의 날짜 문자열
 * @param options Intl.DateTimeFormatOptions
 * @returns 포맷된 날짜 문자열 또는 "날짜 오류"
 */
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDate(dateString);
  if (!isValidDate(date)) {
    return '날짜 오류';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString('ko-KR', defaultOptions);
}

/**
 * 두 날짜 사이의 일수 계산
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수 (음수 가능)
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 날짜가 과거인지 확인
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 과거 날짜인지 여부
 */
export function isPastDate(dateString: string | null | undefined): boolean {
  const date = parseDate(dateString);
  if (!isValidDate(date)) {
    return false;
  }
  return date.getTime() < Date.now();
}

/**
 * ISO 문자열을 datetime-local 형식으로 변환 (한국 시간 기준)
 * @param isoString ISO 8601 형식의 날짜 문자열 (예: "2026-01-09T05:06:00.000Z")
 * @returns datetime-local 형식 문자열 (예: "2026-01-09T14:06")
 */
export function isoToDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return "";
  }
  
  // 로컬 시간대로 변환하여 datetime-local 형식으로 반환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * ISO 문자열을 date 형식으로 변환 (한국 시간 기준)
 * @param isoString ISO 8601 형식의 날짜 문자열
 * @returns date 형식 문자열 (예: "2026-01-09")
 */
export function isoToDateLocal(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return "";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
