import type { Metadata } from "next"
import { projectApi } from "@/src/services/crowdService"
import { toS3ImageUrl } from "@/src/services/utils/imageUtils"

/**
 * 프로젝트 상세 페이지 메타데이터
 * generateMetadata: params.id로 API 호출 후 동적으로 title/description 설정
 * → 검색엔진·SNS 공유 시 실제 프로젝트 제목·설명이 노출됨
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const projectId = parseInt(id, 10)
  if (isNaN(projectId)) {
    return {
      title: "프로젝트를 찾을 수 없습니다 | DDIP",
    }
  }

  try {
    const project = await projectApi.getProject(projectId)
    const description =
      project.description?.slice(0, 160) || `${project.title} - DDIP 크라우드펀딩`
    const imageUrl =
      project.imageUrl || (project.imageUrls?.[0] ? toS3ImageUrl(project.imageUrls[0]) : null)

    return {
      title: `${project.title} | DDIP`,
      description,
      openGraph: {
        title: project.title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    }
  } catch {
    return {
      title: "프로젝트 | DDIP",
    }
  }
}

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
