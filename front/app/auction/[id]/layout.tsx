import type { Metadata } from "next"
import { auctionApi } from "@/src/services/auctionService"

/**
 * 경매 상세 페이지 메타데이터
 * generateMetadata: params.id로 API 호출 후 동적으로 title/description 설정
 * → 검색엔진·SNS 공유 시 실제 경매 제목·설명이 노출됨
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const auctionId = parseInt(id, 10)
  if (isNaN(auctionId)) {
    return {
      title: "경매를 찾을 수 없습니다 | DDIP",
    }
  }

  try {
    const auction = await auctionApi.getAuction(auctionId)
    const description =
      auction.description?.slice(0, 160) || `${auction.title} - DDIP 경매`
    const rawImg =
      auction.imageUrl ||
      auction.imageUrls?.[0] ||
      auction.thumbnailImageUrl
    const imageUrl = rawImg ?? undefined

    return {
      title: `${auction.title} | DDIP`,
      description,
      openGraph: {
        title: auction.title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    }
  } catch {
    return {
      title: "경매 | DDIP",
    }
  }
}

export default function AuctionDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
