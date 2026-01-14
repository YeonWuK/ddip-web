"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Badge } from "@/src/components/ui/badge"
import { Gavel, Clock } from "lucide-react"
import { BidPlacedEvent } from "@/src/types/websocket"

interface RealtimeBidListProps {
  bids: BidPlacedEvent[]
  maxItems?: number
}

/**
 * 실시간 입찰 내역 표시 컴포넌트
 * 웹소켓으로 받은 입찰 이벤트를 실시간으로 표시
 */
export function RealtimeBidList({ bids, maxItems = 10 }: RealtimeBidListProps) {
  const displayBids = bids.slice(0, maxItems)

  if (displayBids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="size-5" />
            실시간 입찰 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            아직 입찰이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="size-5" />
          실시간 입찰 내역
          <Badge variant="secondary" className="ml-auto">
            {bids.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBids.map((bid) => (
            <div
              key={bid.bidId}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <Avatar className="size-10">
                <AvatarImage
                  src={bid.bidder.profileImageUrl || undefined}
                  alt={bid.bidder.nickname}
                />
                <AvatarFallback>
                  {bid.bidder.nickname[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{bid.bidder.nickname}</p>
                  <Badge variant="outline" className="text-xs">
                    {bid.amount.toLocaleString()}원
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="size-3" />
                  <span>
                    {new Date(bid.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {bids.length > maxItems && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            최근 {maxItems}건만 표시됩니다 (총 {bids.length}건)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
