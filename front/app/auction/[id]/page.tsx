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
import { AlertCircle, Clock, Gavel, Heart, Share2, MapPin, Loader2, ChevronLeft, ChevronRight, Edit, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { auctionApi } from "@/src/services/api"
import { AuctionResponse } from "@/src/types/api"
import { toast } from "sonner"
import { useAuth } from "@/src/contexts/auth-context"
import { BidResponse } from "@/src/types/api"
import { maskUserId, formatRelativeTime } from "@/src/lib/user-utils"
import { formatIncrement } from "@/src/lib/format-amount"
import { isInWishlist, toggleWishlist } from "@/src/lib/wishlist"
import { canEditAuction, canCancelAuction, canBidAuction, isAuctionSeller } from "@/src/lib/permissions"
import { showAuctionNotificationIfNeeded } from "@/src/lib/auction-notifications"
// 웹소켓 관련 (백엔드 준비되면 주석 해제)
// import { useAuctionSocket } from "@/src/hooks/useAuctionSocket"
// import { RealtimeBidList } from "@/src/components/realtime-bid-list"
// import { BidPlacedEvent } from "@/src/types/websocket"

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [auction, setAuction] = useState<AuctionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState(0)
  const [timeLeft, setTimeLeft] = useState("")
  const [isBidding, setIsBidding] = useState(false)
  const [bidHistory, setBidHistory] = useState<BidResponse[]>([])
  const [loadingBids, setLoadingBids] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // 알림 표시 여부 추적 (중복 알림 방지)
  const notificationShownRef = useRef<{
    started?: boolean
    ended?: boolean
  }>({})
  
  // 페이지 가시성 추적 (백그라운드에서는 알림 표시 안 함)
  const [isPageVisible, setIsPageVisible] = useState(true)
  
  // 실시간 입찰 내역 (웹소켓 사용 시)
  // const [realtimeBids, setRealtimeBids] = useState<BidPlacedEvent[]>([])
  
  // 웹소켓 연결 (백엔드 준비되면 주석 해제)
  // const {
  //   isConnected,
  //   connectionStatus,
  //   joinAuction,
  //   leaveAuction,
  //   placeBid: socketPlaceBid,
  //   onBidPlaced,
  //   onAuctionUpdated,
  //   onBidFailed,
  //   onAuctionEnded,
  // } = useAuctionSocket()
  
  // const auctionIdRef = useRef<number | null>(null)

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
        
        // 상태 체크 및 업데이트
        await auctionApi.checkAndUpdateAuctionStatus(auctionId)
        
        let data = await auctionApi.getAuction(auctionId)
        setAuction(data)
        // bidStep이 없을 경우 기본값 사용 (1000원)
        const bidStep = data.bidStep || 1000
        setBidAmount(data.currentPrice + bidStep)
        
        // 입찰 내역도 함께 로드
        try {
          const bids = await auctionApi.getBidsByAuction(auctionId)
          setBidHistory(bids)
        } catch (err) {
          console.error("입찰 내역 로드 실패:", err)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "경매 정보를 불러오는 중 오류가 발생했습니다")
        toast.error("경매 정보를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    loadAuction()
  }, [id])

  // 페이지 가시성 추적 (백그라운드에서는 알림 표시 안 함)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 경매 상태 주기적 체크 (종료 시간에 따라 동적으로 조정)
  useEffect(() => {
    if (!auction) return

    let timeoutId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      const auctionId = parseInt(id, 10)
      if (isNaN(auctionId)) return

        const updatedAuction = await auctionApi.checkAndUpdateAuctionStatus(auctionId)
        if (updatedAuction && updatedAuction.status !== auction.status) {
          // 상태가 변경되었으면 경매 정보 새로고침
          setAuction(updatedAuction)
          const bidStep = updatedAuction.bidStep || 1000
          setBidAmount(updatedAuction.currentPrice + bidStep)
        
        // 입찰 내역도 새로고침
        try {
          const bids = await auctionApi.getBidsByAuction(auctionId)
          setBidHistory(bids)
        } catch (err) {
          console.error("입찰 내역 로드 실패:", err)
        }

        // 상태 변경 알림 (페이지가 보이고, 최초 한 번만 표시)
        if (isPageVisible) {
          showAuctionNotificationIfNeeded(
            updatedAuction.id,
            updatedAuction.title,
            updatedAuction.status,
            auction.status
          )
          
          // 로컬 ref 업데이트 (중복 방지용)
          if (updatedAuction.status === 'ENDED') {
            notificationShownRef.current.ended = true
          } else if (updatedAuction.status === 'RUNNING') {
            notificationShownRef.current.started = true
          }
        }
      }

      // 다음 체크 주기 계산
      const now = new Date().getTime()
      const startTime = new Date(auction.startAt).getTime()
      const endTime = new Date(auction.endAt).getTime()
      
      // 시작 시간까지의 거리
      const distanceToStart = startTime - now
      // 종료 시간까지의 거리
      const distanceToEnd = endTime - now
      
      // 가장 가까운 이벤트 시간까지의 거리
      const minDistance = Math.min(
        distanceToStart > 0 ? distanceToStart : Infinity,
        distanceToEnd > 0 ? distanceToEnd : Infinity
      )
      
      let checkInterval: number
      
      // 1분 미만: 1초마다 (정확한 타이밍)
      if (minDistance < 60 * 1000) {
        checkInterval = 1000
      }
      // 5분 미만: 2초마다
      else if (minDistance < 5 * 60 * 1000) {
        checkInterval = 2000
      }
      // 10분 미만: 5초마다
      else if (minDistance < 10 * 60 * 1000) {
        checkInterval = 5000
      }
      // 30분 미만: 10초마다
      else if (minDistance < 30 * 60 * 1000) {
        checkInterval = 10000
      }
      // 그 외: 30초마다
      else {
        checkInterval = 30000
      }
      
      // 다음 체크 예약
      timeoutId = setTimeout(checkStatus, checkInterval)
    }

    // 즉시 한 번 체크
    checkStatus()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [id, auction, isPageVisible])

  // 찜하기 상태 동기화
  useEffect(() => {
    if (auction) {
      setIsFavorite(isInWishlist(auction.id, "auction"))
    }
  }, [auction])

  // 남은 시간 계산
  useEffect(() => {
    if (!auction) return

    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const endTimeObj = new Date(auction.endAt)
      
      // Invalid Date 체크
      if (isNaN(endTimeObj.getTime())) {
        console.error("Invalid endAt date:", auction.endAt)
        setTimeLeft("날짜 오류")
        return
      }
      
      const endTime = endTimeObj.getTime()
      const distance = endTime - now

      if (distance < 0) {
        setTimeLeft("경매 종료")
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      // 마지막 10분 미만일 때만 초 표시 (성능 최적화)
      const totalMinutes = days * 24 * 60 + hours * 60 + minutes
      const showSeconds = totalMinutes < 10

      if (days > 0) {
        setTimeLeft(`${days}일 ${hours}시간 ${minutes}분`)
      } else if (hours > 0) {
        if (showSeconds) {
          setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`)
        } else {
          setTimeLeft(`${hours}시간 ${minutes}분`)
        }
      } else {
        if (showSeconds) {
          // 1분 미만일 때는 초만 표시
          if (minutes === 0) {
            setTimeLeft(`${seconds}초`)
          } else {
            setTimeLeft(`${minutes}분 ${seconds}초`)
          }
        } else {
          setTimeLeft(`${minutes}분`)
        }
      }
    }

    // 초 표시가 필요할 때만 1초마다, 그 외에는 1분마다 업데이트
    updateTimeLeft() // 즉시 실행
    const now = new Date().getTime()
    const endTime = new Date(auction.endAt).getTime()
    const distance = endTime - now
    const totalMinutes = Math.floor(distance / (1000 * 60))
    const needsSecondUpdate = totalMinutes < 10

    const timer = setInterval(updateTimeLeft, needsSecondUpdate ? 1000 : 60000)

    return () => clearInterval(timer)
  }, [auction])

  const handleQuickBid = (increment: number) => {
    if (!auction) return
    setBidAmount((prev) => {
      const newAmount = prev + increment
      const bidStep = auction.bidStep || 1000
      const minBid = auction.currentPrice + bidStep
      return Math.max(newAmount, minBid)
    })
  }

  // 경매 취소 핸들러
  const handleCancelAuction = async () => {
    if (!auction) return
    
    if (!confirm("정말로 이 경매를 취소하시겠습니까? 취소된 경매는 복구할 수 없습니다.")) {
      return
    }

    try {
      await auctionApi.updateAuction(auction.id, {
        status: "CANCELED" as const,
      })
      toast.success("경매가 취소되었습니다")
      // 경매 정보 새로고침
      const updatedAuction = await auctionApi.getAuction(auction.id)
      setAuction(updatedAuction)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "경매 취소에 실패했습니다")
    }
  }

  const handleBid = async () => {
    if (!auction) return

    const auctionId = parseInt(id, 10)
    if (isNaN(auctionId)) {
      toast.error("유효하지 않은 경매 ID입니다")
      return
    }

    // 권한 체크
    if (!canBidAuction(auction, user)) {
      if (isAuctionSeller(auction, user)) {
        toast.error("자신의 경매에는 입찰할 수 없습니다")
      } else {
        toast.error("입찰할 수 없는 경매입니다")
      }
      return
    }

    const bidStep = auction.bidStep || 1000
    if (bidAmount < auction.currentPrice + bidStep) {
      toast.error(`최소 입찰 금액은 ${(auction.currentPrice + bidStep).toLocaleString()}원입니다`)
      return
    }

    // 실제 상태 확인 (시작일이 지났으면 RUNNING으로 간주)
    const now = new Date()
    const startTime = new Date(auction.startAt)
    const hasStarted = !isNaN(startTime.getTime()) && startTime <= now
    const canBid = auction.status === "RUNNING" || (auction.status === "SCHEDULED" && hasStarted)
    
    if (!canBid) {
      toast.error("진행 중인 경매에만 입찰할 수 있습니다")
      return
    }

    try {
      setIsBidding(true)
      
      // 웹소켓 사용 시 (백엔드 준비되면 주석 해제)
      // if (isConnected) {
      //   socketPlaceBid(auctionId, bidAmount)
      //   // 웹소켓 이벤트로 결과를 받음 (onBidPlaced, onBidFailed)
      //   return
      // }
      
      // Mock API 사용 (웹소켓 미사용 시)
      const updatedAuction = await auctionApi.placeBid(auctionId, bidAmount)
      
      // 입찰 후 상태 체크 (종료 시간이 지났을 수 있음)
      const finalAuction = await auctionApi.checkAndUpdateAuctionStatus(auctionId)
      const auctionToUse = finalAuction || updatedAuction
      
      setAuction(auctionToUse)
      const bidStep = auctionToUse.bidStep || 1000
      setBidAmount(auctionToUse.currentPrice + bidStep)
      
      // 입찰 내역 새로고침
      const bids = await auctionApi.getBidsByAuction(auctionId)
      setBidHistory(bids)
      
      if (auctionToUse.status === 'ENDED') {
        toast.success(`입찰이 완료되었습니다! 경매가 종료되었습니다. (최종가: ${auctionToUse.currentPrice.toLocaleString()}원)`)
      } else {
        toast.success(`입찰이 완료되었습니다! 현재 입찰가: ${auctionToUse.currentPrice.toLocaleString()}원`)
      }
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

  // 날짜 파싱 (안전하게)
  const endTime = new Date(auction.endAt)
  const startTime = new Date(auction.startAt)
  
  // Invalid Date 체크
  if (isNaN(endTime.getTime()) || isNaN(startTime.getTime())) {
    console.error("Invalid date in auction:", { startAt: auction.startAt, endAt: auction.endAt })
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>경매 날짜 정보가 유효하지 않습니다</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // 시작일이 지났는지 확인하여 실제 상태 결정
  const now = new Date()
  const hasStarted = startTime <= now
  const hasEnded = endTime <= now
  
  // 실제 경매 상태 계산 (시작일이 지났으면 RUNNING, 종료일이 지났으면 ENDED)
  let actualStatus = auction.status
  if (hasEnded && auction.status !== "ENDED" && auction.status !== "CANCELED") {
    actualStatus = "ENDED" as const
  } else if (hasStarted && auction.status === "SCHEDULED") {
    actualStatus = "RUNNING" as const
  }
  
  const isLive = actualStatus === "RUNNING"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero image gallery */}
            {(() => {
              const images = auction.imageUrls && auction.imageUrls.length > 0 
                ? auction.imageUrls 
                : auction.imageUrl 
                  ? [auction.imageUrl] 
                  : ["/placeholder.svg"]
              const hasMultipleImages = images.length > 1

              return (
                <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={images[selectedImageIndex] || "/placeholder.svg"}
                    alt={auction.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* 이미지 네비게이션 버튼 */}
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      
                      {/* 이미지 인디케이터 */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`h-2 rounded-full transition-all ${
                              index === selectedImageIndex
                                ? "w-8 bg-primary"
                                : "w-2 bg-background/50 hover:bg-background/80"
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                            aria-label={`이미지 ${index + 1}로 이동`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
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
              )
            })()}

            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="mb-3 text-balance text-3xl font-bold leading-tight md:text-4xl">{auction.title}</h1>
              <p className="mb-4 text-pretty text-lg text-muted-foreground">{auction.description}</p>

              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (!auction) return
                    const newState = toggleWishlist(auction.id, "auction")
                    setIsFavorite(newState)
                    if (newState) {
                      toast.success("찜하기에 추가되었습니다")
                    } else {
                      toast.info("찜하기에서 제거되었습니다")
                    }
                  }}
                >
                  <Heart className={`mr-2 size-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  찜하기
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 size-4" />
                  공유하기
                </Button>
                
                {/* 판매자 전용 버튼 */}
                {canEditAuction(auction, user) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      router.push(`/auction/${auction.id}/edit`)
                    }}
                  >
                    <Edit className="mr-2 size-4" />
                    수정하기
                  </Button>
                )}
                {canCancelAuction(auction, user) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelAuction}
                  >
                    <X className="mr-2 size-4" />
                    취소하기
                  </Button>
                )}
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
                {/* 웹소켓 사용 시 실시간 입찰 내역 탭 추가 (백엔드 준비되면 주석 해제) */}
                {/* <TabsTrigger value="bids">실시간 입찰 내역</TabsTrigger> */}
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
                        <span className="text-muted-foreground">
                          {(auction.bidStep || 1000).toLocaleString()}원
                        </span>
                      </div>
                      {auction.buyoutPrice != null && auction.buyoutPrice > 0 && (
                        <div className="flex items-center justify-between border-b pb-3">
                          <span className="font-medium">즉시 구매가</span>
                          <span className="text-muted-foreground">{auction.buyoutPrice.toLocaleString()}원</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="font-medium">경매 시작</span>
                        <span className="text-muted-foreground">
                          {isNaN(startTime.getTime()) 
                            ? "날짜 오류" 
                            : startTime.toLocaleString("ko-KR", { 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">경매 종료</span>
                        <span className="text-muted-foreground">
                          {isNaN(endTime.getTime()) 
                            ? "날짜 오류" 
                            : endTime.toLocaleString("ko-KR", { 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 실시간 입찰 내역 탭 (웹소켓 사용 시, 백엔드 준비되면 주석 해제) */}
              {/* <TabsContent value="bids" className="mt-6">
                <RealtimeBidList bids={realtimeBids} maxItems={20} />
              </TabsContent> */}
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
                    {isLive ? "경매 진행 중" : actualStatus === "SCHEDULED" ? "경매 대기" : "경매 종료"}
                  </CardTitle>
                  {actualStatus !== "ENDED" && actualStatus !== "CANCELED" && (
                    <CardDescription className="text-base font-semibold text-foreground">{timeLeft || "계산 중..."} 남음</CardDescription>
                  )}
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

                  {isLive && canBidAuction(auction, user) && (() => {
                    const bidStep = auction.bidStep || 1000
                    return (
                      <div className="space-y-3">
                        <Label htmlFor="bid-amount">입찰 금액</Label>
                        <div className="relative">
                          <Input
                            id="bid-amount"
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(Number(e.target.value))}
                            min={auction.currentPrice + bidStep}
                            step={bidStep}
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
                            onClick={() => handleQuickBid(bidStep * 2)}
                            disabled={isBidding}
                          >
                            {formatIncrement(bidStep * 2)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleQuickBid(bidStep * 4)}
                            disabled={isBidding}
                          >
                            {formatIncrement(bidStep * 4)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleQuickBid(bidStep * 10)}
                            disabled={isBidding}
                          >
                            {formatIncrement(bidStep * 10)}
                          </Button>
                        </div>

                        <Alert>
                          <AlertCircle className="size-4" />
                          <AlertDescription className="text-xs">
                            최소 입찰 단위는 {bidStep.toLocaleString()}원입니다
                          </AlertDescription>
                        </Alert>

                        <Button 
                          size="lg" 
                          className="w-full" 
                          onClick={handleBid}
                          disabled={isBidding || bidAmount < auction.currentPrice + bidStep}
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
                    )
                  })()}

                  {!isLive && (
                    <Alert>
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        {actualStatus === "ENDED" 
                          ? "이 경매는 종료되었습니다" 
                          : actualStatus === "CANCELED"
                          ? "이 경매는 취소되었습니다"
                          : "경매가 아직 시작되지 않았습니다"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {isLive && !canBidAuction(auction, user) && (
                    <Alert>
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        {isAuctionSeller(auction, user)
                          ? "자신의 경매에는 입찰할 수 없습니다"
                          : "입찰할 수 없는 경매입니다"}
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
                    <span className="font-semibold">{(auction.bidStep || 1000).toLocaleString()}원</span>
                  </div>
                  {auction.buyoutPrice != null && auction.buyoutPrice > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">즉시 구매가</span>
                      <span className="font-semibold">{auction.buyoutPrice.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">경매 시작</span>
                    <span className="font-semibold">
                      {isNaN(startTime.getTime()) 
                        ? "날짜 오류" 
                        : startTime.toLocaleString("ko-KR", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">경매 종료</span>
                    <span className="font-semibold">
                      {isNaN(endTime.getTime()) 
                        ? "날짜 오류" 
                        : endTime.toLocaleString("ko-KR", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 입찰 내역 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="size-5" />
                    입찰 내역
                    {bidHistory.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {bidHistory.length}건
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBids ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : bidHistory.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      아직 입찰이 없습니다
                    </div>
                  ) : (
                    <div className="max-h-[400px] space-y-2 overflow-y-auto">
                      {bidHistory.map((bid, index) => {
                        const isMyBid = user?.id === bid.bidder.id
                        const isHighest = index === 0 && bid.amount === auction.currentPrice
                        
                        return (
                          <div
                            key={bid.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                              isMyBid
                                ? "border-primary bg-primary/5"
                                : isHighest
                                ? "border-secondary bg-secondary/5"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarImage src={bid.bidder.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {bid.bidder.nickname?.[0] || bid.bidder.name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {maskUserId(bid.bidder)}
                                  </span>
                                  {isMyBid && (
                                    <Badge variant="outline" className="text-xs">
                                      내 입찰
                                    </Badge>
                                  )}
                                  {isHighest && (
                                    <Badge variant="secondary" className="text-xs">
                                      최고가
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(bid.createdAt).toLocaleString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg">
                                {bid.amount.toLocaleString()}원
                              </div>
                              {index < bidHistory.length - 1 && (() => {
                                // 다음 입찰가 (더 오래된 입찰, index가 클수록 오래됨)
                                // 입찰 내역이 최신순으로 정렬되어 있으므로, index가 큰 것이 더 오래된 입찰
                                const nextBid = bidHistory[index + 1]
                                // 증가액 계산 (현재 입찰가 - 다음 입찰가(더 오래된 입찰))
                                const increase = bid.amount - nextBid.amount
                                // 입찰은 항상 증가해야 하므로 양수만 표시
                                if (increase > 0) {
                                  return (
                                    <div className="text-xs font-medium text-green-600 dark:text-green-400">
                                      +{increase.toLocaleString()}원
                                    </div>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
