"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Progress } from "@/src/components/ui/progress"
import { Button } from "@/src/components/ui/button"
import { Clock, TrendingUp, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { isInWishlist, toggleWishlist } from "@/src/lib/wishlist"
import { toast } from "sonner"
import type { ProjectStatus } from "@/src/types/api"

const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "성공",
  FAILED: "실패",
  CANCELED: "취소됨",
  REJECTED: "거절됨",
  STOP: "일시정지",
  DRAFT: "오픈 전",
}

interface ProjectCardProps {
  id: string
  title: string
  description: string
  image: string
  category: string
  currentAmount: number
  goalAmount: number
  backers: number
  daysLeft: number
  status?: ProjectStatus
  /** Wadiz 스타일 컴팩트 카드 (리스트 페이지용) */
  compact?: boolean
}

export function ProjectCard({
  id,
  title,
  description,
  image,
  category,
  currentAmount,
  goalAmount,
  backers,
  daysLeft,
  status,
  compact = false,
}: ProjectCardProps) {
  const progress = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0
  const normalizedStatus = (status || "").toUpperCase()
  const isNonOpen = normalizedStatus && normalizedStatus !== "OPEN"
  const statusLabel = isNonOpen ? STATUS_LABELS[normalizedStatus] ?? normalizedStatus : null
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setIsFavorite(isInWishlist(Number(id), "project"))
  }, [id])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const projectId = Number(id)
    const newState = toggleWishlist(projectId, "project")
    setIsFavorite(newState)
    
    if (newState) {
      toast.success("찜하기에 추가되었습니다")
    } else {
      toast.info("찜하기에서 제거되었습니다")
    }
  }

  return (
    <Link href={`/project/${id}`}>
      <Card
        className={`group overflow-hidden transition-all hover:shadow-lg ${
          compact ? "py-3 gap-4" : ""
        } ${isNonOpen ? "opacity-90" : ""}`}
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className={`absolute flex gap-1.5 ${compact ? "right-2 top-2" : "right-3 top-3 gap-2"}`}>
            {normalizedStatus === "OPEN" && (
              <Badge className={compact ? "bg-primary text-primary-foreground border-primary text-xs" : "bg-primary text-primary-foreground border-primary"}>
                진행 중
              </Badge>
            )}
            {statusLabel && (
              <Badge className={compact ? "bg-black text-white border-black text-xs" : "bg-black text-white border-black"}>
                {statusLabel}
              </Badge>
            )}
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
          <div>
            <div className={`flex items-baseline justify-between ${compact ? "mb-1" : "mb-2"}`}>
              <div>
                <span className={`font-bold text-primary ${compact ? "text-lg" : "text-2xl"}`}>{currentAmount.toLocaleString()}</span>
                <span className={`ml-1 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>원</span>
              </div>
              <span className={`font-medium text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className={compact ? "h-1.5" : "h-2"} />
          </div>
        </CardContent>

        <CardFooter className={`flex items-center justify-between border-t text-muted-foreground ${compact ? "pt-2 px-4 text-xs" : "pt-4 text-sm"}`}>
          <div className="flex items-center gap-1">
            <TrendingUp className={compact ? "size-3" : "size-4"} />
            <span>{backers.toLocaleString()}명 참여</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={compact ? "size-3" : "size-4"} />
            <span>{daysLeft}일 남음</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
