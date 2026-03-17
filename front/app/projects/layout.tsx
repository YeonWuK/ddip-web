import type { Metadata } from "next"

/** 프로젝트 목록 페이지 메타데이터 (정적) */
export const metadata: Metadata = {
  title: "프로젝트 | DDIP",
  description: "진행 중인 크라우드펀딩 프로젝트를 둘러보세요. DDIP",
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
