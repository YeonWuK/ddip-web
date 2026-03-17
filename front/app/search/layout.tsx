import type { Metadata } from "next"

/**
 * 검색 페이지 메타데이터 (정적)
 * 검색어는 쿼리 파라미터라 클라이언트에서만 알 수 있어, 여기선 공통 설명만 설정
 */
export const metadata: Metadata = {
  title: "검색 | DDIP",
  description: "프로젝트와 경매를 통합 검색하세요. DDIP 크라우드펀딩 & 경매 플랫폼",
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
