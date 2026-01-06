"use client"

import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { AlertCircle, Clock, Gavel, Heart, Share2, MapPin, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, use } from "react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { auctionApi } from "@/src/services/api"
import { AuctionResponse } from "@/src/types/api"
import { toast } from "sonner"

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [auction, setAuction] = useState<AuctionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState(0)
  const [timeLeft, setTimeLeft] = useState("")
  const [isBidding, setIsBidding] = useState(false)

  // 경매 데이터 로드
  useEffect(() => {
    const loadAuction = async () => {
      try {
        setLoading(true)
        setError(null)
        const auctionId = parseInt(id, 10)
        if (isNaN(auctionId)) {
          throw new Error("유효하지 않은 경매 ID입니다")
        }
        const data = await auctionApi.getAuction(auctionId)
        setAuction(data)
        setBidAmount(data.currentPrice + data.bidStep)
      } catch (err) {
        setError(err instanceof Error ? err.message : "경매 정보를 불러오는 중 오류가 발생했습니다")
        toast.error("경매 정보를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    loadAuction()
  }, [id])

  // 남은 시간 계산
  useEffect(() => {
    if (!auction) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const endTime = new Date(auction.endAt).getTime()
      const distance = endTime - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft("경매 종료")
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}일 ${hours}시간 ${minutes}분`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`)
      } else {
        setTimeLeft(`${minutes}분 ${seconds}초`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [auction])

  const handleQuickBid = (increment: number) => {
    if (!auction) return
    setBidAmount((prev) => {
      const newAmount = prev + increment
      const minBid = auction.currentPrice + auction.bidStep
      return Math.max(newAmount, minBid)
    })
  }

  const handleBid = async () => {
    if (!auction) return

    const auctionId = parseInt(id, 10)
    if (isNaN(auctionId)) {
      toast.error("유효하지 않은 경매 ID입니다")
      return
    }

    if (bidAmount < auction.currentPrice + auction.bidStep) {
      toast.error(`최소 입찰 금액은 ${(auction.currentPrice + auction.bidStep).toLocaleString()}원입니다`)
      return
    }

    if (auction.status !== "RUNNING") {
      toast.error("진행 중인 경매에만 입찰할 수 있습니다")
      return
    }

    try {
      setIsBidding(true)
      const updatedAuction = await auctionApi.placeBid(auctionId, bidAmount)
      setAuction(updatedAuction)
      setBidAmount(updatedAuction.currentPrice + updatedAuction.bidStep)
      toast.success(`입찰이 완료되었습니다! 현재 입찰가: ${updatedAuction.currentPrice.toLocaleString()}원`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "입찰 중 오류가 발생했습니다")
    } finally {
      setIsBidding(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">경매 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    )
  }

  // 에러 상태
  if (error || !auction) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error || "경매 정보를 찾을 수 없습니다"}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  const isLive = auction.status === "RUNNING"
  const endTime = new Date(auction.endAt)
  const startTime = new Date(auction.startAt)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src={auction.imageUrl || "/placeholder.svg"}
                alt={auction.title}
                fill
                className="object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge className="bg-secondary text-secondary-foreground">경매</Badge>
                {isLive && (
                  <Badge className="animate-pulse bg-destructive text-destructive-foreground">LIVE</Badge>
                )}
                {auction.status === "ENDED" && (
                  <Badge variant="secondary">종료됨</Badge>
                )}
                {auction.status === "CANCELED" && (
                  <Badge variant="destructive">취소됨</Badge>
                )}
              </div>
            </div>

            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="mb-3 text-balance text-3xl font-bold leading-tight md:text-4xl">{auction.title}</h1>
              <p className="mb-4 text-pretty text-lg text-muted-foreground">{auction.description}</p>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 size-4" />
                  관심 등록
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 size-4" />
                  공유하기
                </Button>
              </div>
            </div>

            {/* Seller info */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="size-12">
                      <AvatarImage
                        src={auction.seller.profileImageUrl || "/placeholder.svg"}
                        alt={auction.seller.nickname}
                      />
                      <AvatarFallback>{auction.seller.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{auction.seller.nickname}</CardTitle>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {auction.seller.email || "이메일 없음"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="description">상품 설명</TabsTrigger>
                <TabsTrigger value="info">경매 정보</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardContent className="prose prose-sm max-w-none pt-6 dark:prose-invert">
                    <div className="whitespace-pre-line leading-relaxed">{auction.description}</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="font-medium">시작가</span>
                        <span className="text-muted-foreground">{auction.startPrice.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="font-medium">입찰 단위</span>
                        <span className="text-muted-foreground">{auction.bidStep.toLocaleString()}원</span>
                      </div>
                      {auction.buyoutPrice && (
                        <div className="flex items-center justify-between border-b pb-3">
                          <span className="font-medium">즉시 구매가</span>
                          <span className="text-muted-foreground">{auction.buyoutPrice.toLocaleString()}원</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="font-medium">경매 시작</span>
                        <span className="text-muted-foreground">{startTime.toLocaleDateString("ko-KR")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">경매 종료</span>
                        <span className="text-muted-foreground">{endTime.toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Bidding card */}
              <Card className="border-primary shadow-lg">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock className="size-5" />
                    {isLive ? "경매 진행 중" : auction.status === "SCHEDULED" ? "경매 대기" : "경매 종료"}
                  </CardTitle>
                  <CardDescription className="text-base font-semibold text-foreground">{timeLeft || "계산 중..."} 남음</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">현재 입찰가</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-secondary">
                        {auction.currentPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                    {auction.winner && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        낙찰자: {auction.winner.nickname}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {isLive && (
                    <div className="space-y-3">
                      <Label htmlFor="bid-amount">입찰 금액</Label>
                      <div className="relative">
                        <Input
                          id="bid-amount"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          min={auction.currentPrice + auction.bidStep}
                          step={auction.bidStep}
                          className="pr-12 text-lg font-semibold"
                          disabled={isBidding}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          원
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleQuickBid(auction.bidStep * 2)}
                          disabled={isBidding}
                        >
                          +{auction.bidStep * 2 >= 10000 ? `${(auction.bidStep * 2 / 10000).toFixed(0)}만` : `${auction.bidStep * 2 / 1000}천`}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleQuickBid(auction.bidStep * 4)}
                          disabled={isBidding}
                        >
                          +{auction.bidStep * 4 >= 10000 ? `${(auction.bidStep * 4 / 10000).toFixed(0)}만` : `${auction.bidStep * 4 / 1000}천`}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleQuickBid(auction.bidStep * 10)}
                          disabled={isBidding}
                        >
                          +{auction.bidStep * 10 >= 10000 ? `${(auction.bidStep * 10 / 10000).toFixed(0)}만` : `${auction.bidStep * 10 / 1000}천`}
                        </Button>
                      </div>

                      <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription className="text-xs">
                          최소 입찰 단위는 {auction.bidStep.toLocaleString()}원입니다
                        </AlertDescription>
                      </Alert>

                      <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleBid}
                        disabled={isBidding || bidAmount < auction.currentPrice + auction.bidStep}
                      >
                        {isBidding ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            입찰 중...
                          </>
                        ) : (
                          <>
                            <Gavel className="mr-2 size-4" />
                            입찰하기
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!isLive && (
                    <Alert>
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        {auction.status === "ENDED" 
                          ? "이 경매는 종료되었습니다" 
                          : auction.status === "CANCELED"
                          ? "이 경매는 취소되었습니다"
                          : "경매가 아직 시작되지 않았습니다"}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Additional info */}
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">시작가</span>
                    <span className="font-semibold">{auction.startPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">입찰 단위</span>
                    <span className="font-semibold">{auction.bidStep.toLocaleString()}원</span>
                  </div>
                  {auction.buyoutPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">즉시 구매가</span>
                      <span className="font-semibold">{auction.buyoutPrice.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">경매 시작</span>
                    <span className="font-semibold">{startTime.toLocaleDateString("ko-KR")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">경매 종료</span>
                    <span className="font-semibold">{endTime.toLocaleDateString("ko-KR")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
