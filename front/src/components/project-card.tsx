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
}: ProjectCardProps) {
  const progress = (currentAmount / goalAmount) * 100
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
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Badge>{category}</Badge>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleHeartClick}
            >
              <Heart
                className={`size-4 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </Button>
          </div>
        </div>

        <CardHeader className="pb-3">
          <h3 className="line-clamp-2 text-balance text-lg font-semibold leading-tight">{title}</h3>
          <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">{description}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">{currentAmount.toLocaleString()}</span>
                <span className="ml-1 text-sm text-muted-foreground">원</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="size-4" />
            <span>{backers.toLocaleString()}명 참여</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{daysLeft}일 남음</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
