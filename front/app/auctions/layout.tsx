import type { Metadata } from "next"

/** 경매 목록 페이지 메타데이터 (정적) */
export const metadata: Metadata = {
  title: "경매 | DDIP",
  description: "실시간 경매 목록을 둘러보세요. DDIP 크라우드펀딩 & 경매 플랫폼",
}

export default function AuctionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
