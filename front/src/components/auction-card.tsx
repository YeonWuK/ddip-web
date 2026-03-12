"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Clock, Gavel, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { isInWishlist, toggleWishlist, WISHLIST_CHANGED_EVENT } from "@/src/lib/wishlist"
import { toast } from "sonner"
import type { AuctionStatus } from "@/src/types/api"

const AUCTION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "예정",
  ENDED: "종료",
  CANCELED: "취소됨",
}

interface AuctionCardProps {
  id: string
  title: string
  description: string
  image: string
  category: string
  currentBid: number
  bidCount: number
  timeLeft: string
  isLive: boolean
  status?: AuctionStatus
  /** Wadiz 스타일 컴팩트 카드 (리스트 페이지용) */
  compact?: boolean
  /** 입찰가가 막 업데이트됐을 때 시각 효과 표시 */
  priceJustUpdated?: boolean
}

export function AuctionCard({
  id,
  title,
  description,
  image,
  category,
  currentBid,
  bidCount,
  timeLeft,
  isLive,
  status,
  compact = false,
  priceJustUpdated = false,
}: AuctionCardProps) {
  const numericId = Number(id)
  const [isFavorite, setIsFavorite] = useState(false)
  const normalizedStatus = (status || "").toUpperCase()
  const isNonRunning = normalizedStatus && normalizedStatus !== "RUNNING"
  const statusLabel = isNonRunning ? AUCTION_STATUS_LABELS[normalizedStatus] ?? normalizedStatus : null

  useEffect(() => {
    setIsFavorite(isInWishlist(numericId, "auction"))

    const handleWishlistChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: number; type: "project" | "auction"; inWishlist: boolean }>
      if (customEvent.detail?.type === "auction" && customEvent.detail?.id === numericId) {
        setIsFavorite(customEvent.detail.inWishlist)
      }
    }

    window.addEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChanged)
    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChanged)
    }
  }, [numericId])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    toggleWishlist(numericId, "auction")
    const newState = isInWishlist(numericId, "auction")
    setIsFavorite(newState)
    
    if (newState) {
      toast.success("찜하기에 추가되었습니다")
    } else {
      toast.info("찜하기에서 제거되었습니다")
    }
  }

  return (
    <Link href={`/auction/${id}`}>
      <Card
        className={`group overflow-hidden transition-all hover:shadow-lg ${
          compact ? "py-3 gap-4" : ""
        } ${isNonRunning ? "opacity-90" : ""}`}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className={`absolute flex gap-1.5 ${compact ? "right-2 top-2" : "right-3 top-3 gap-2"}`}>
            {statusLabel && (
              <Badge className={compact ? "bg-black text-white border-black text-xs" : "bg-black text-white border-black"}>
                {statusLabel}
              </Badge>
            )}
            {isLive && <Badge className={compact ? "animate-pulse bg-destructive text-destructive-foreground text-xs" : "animate-pulse bg-destructive text-destructive-foreground"}>LIVE</Badge>}
            <Button
              variant="secondary"
              size="icon"
              className={compact ? "size-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background" : "size-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"}
              onClick={handleHeartClick}
            >
              <Heart
                className={`transition-colors ${compact ? "size-3" : "size-4"} ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </Button>
          </div>
        </div>

        <CardHeader className={compact ? "pb-2 px-4" : "pb-3"}>
          <h3 className={`line-clamp-2 text-balance font-semibold leading-tight ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
          <p className={`line-clamp-2 text-pretty text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>{description}</p>
        </CardHeader>

        <CardContent className={compact ? "space-y-2 px-4" : "space-y-3"}>
          <div
            className={`rounded-md px-2 py-1 -mx-2 -my-1 transition-colors ${
              priceJustUpdated ? "animate-price-flash" : ""
            }`}
          >
            <p className={`text-muted-foreground ${compact ? "mb-0.5 text-xs" : "mb-1 text-xs"}`}>현재 입찰가</p>
            <div className="flex items-baseline gap-1">
              <span className={`font-bold text-secondary ${compact ? "text-lg" : "text-2xl"}`}>{currentBid.toLocaleString()}</span>
              <span className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>원</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className={`flex items-center justify-between border-t text-muted-foreground ${compact ? "pt-2 px-4 text-xs" : "pt-4 text-sm"}`}>
          {bidCount > 0 && (
            <div className="flex items-center gap-1">
              <Gavel className={compact ? "size-3" : "size-4"} />
              <span>{bidCount}회 입찰</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className={compact ? "size-3" : "size-4"} />
            <span>{timeLeft}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
