"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/src/components/navigation"
import { ProtectedRoute } from "@/src/components/protected-route"
import { Card } from "@/src/components/ui/card"
import { userApi } from "@/src/services/api"
import { AuctionSummary } from "@/src/types/api"
import { toast } from "sonner"

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    try {
      setLoading(true)
      const myPage = await userApi.getMyPage()
      setAuctions(myPage.auctions)
    } catch {
      toast.error("내 경매 현황을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const sortedAuctions = useMemo(
    () => [...auctions].sort((a, b) => b.id - a.id),
    [auctions]
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <Navigation />
        <main className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">내 경매 현황 전체</h1>
              <p className="text-sm text-muted-foreground">내가 등록한 경매 {sortedAuctions.length}개</p>
            </div>
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary">
              마이페이지로 돌아가기
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : sortedAuctions.length === 0 ? (
            <Card className="border-none p-10 text-center text-sm text-muted-foreground shadow-sm">
              등록된 경매가 없습니다.
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedAuctions.map((auction) => (
                <Link key={auction.id} href={`/auction/${auction.id}`}>
                  <Card className="border-none p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image src={auction.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold">{auction.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          현재가 {auction.currentPrice.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
