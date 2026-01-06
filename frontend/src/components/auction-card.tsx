import { Card, CardContent, CardFooter, CardHeader } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Clock, Gavel } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
}: AuctionCardProps) {
  return (
    <Link href={`/auction/${id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Badge className="bg-secondary text-secondary-foreground">{category}</Badge>
            {isLive && <Badge className="animate-pulse bg-destructive text-destructive-foreground">LIVE</Badge>}
          </div>
        </div>

        <CardHeader className="pb-3">
          <h3 className="line-clamp-2 text-balance text-lg font-semibold leading-tight">{title}</h3>
          <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">{description}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">현재 입찰가</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-secondary">{currentBid.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Gavel className="size-4" />
            <span>{bidCount}회 입찰</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{timeLeft}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
