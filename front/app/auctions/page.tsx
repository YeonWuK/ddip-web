"use client"

import { Navigation } from "@/src/components/navigation"
import { AuctionCard } from "@/src/components/auction-card"
import { EmptyState } from "@/src/components/empty-state"
import { FilterBar } from "@/src/components/filter-bar"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { auctionApi } from "@/src/services/api"
import { useAuctionListSocket } from "@/src/hooks/useAuctionListSocket"
import { AuctionSummary } from "@/src/types/api"
import { useFilterStore } from "@/src/stores/filterStore"
import { Loader2, Gavel } from "lucide-react"

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [priceJustUpdatedIds, setPriceJustUpdatedIds] = useState<Set<number>>(new Set())
  const clearFlashRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const pageRef = useRef(1)
  const observerTarget = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 20

  const { onBidUpdate } = useAuctionListSocket()
  const { auctionStatus, auctionSort, setAuctionStatus } = useFilterStore()

  // 상태 필터에 취소됨(CANCELED)이 저장되어 있던 기존 사용자 보정
  useEffect(() => {
    if (auctionStatus === "CANCELED") {
      setAuctionStatus("ALL")
    }
  }, [auctionStatus, setAuctionStatus])

  const filterVisibleAuctions = useCallback(
    (data: AuctionSummary[]) =>
      data.filter((auction) => {
        if (auctionStatus === "ALL") {
          return ["SCHEDULED", "RUNNING", "ENDED"].includes(auction.status)
        }
        return auction.status === auctionStatus
      }),
    [auctionStatus]
  )

  const applyBidUpdate = useCallback(({ auctionId, price, bidCount }: { auctionId: number; price: number; bidCount?: number }) => {
    setAuctions((prev) => {
      if (!prev.some((a) => a.id === auctionId)) return prev
      return prev.map((a) =>
        a.id === auctionId
          ? { ...a, currentPrice: price, ...(bidCount != null ? { bidCount } : {}) }
          : a
      )
    })
    setPriceJustUpdatedIds((prev) => new Set(prev).add(auctionId))
    if (clearFlashRef.current[auctionId]) clearTimeout(clearFlashRef.current[auctionId])
    clearFlashRef.current[auctionId] = setTimeout(() => {
      setPriceJustUpdatedIds((p) => {
        const next = new Set(p)
        next.delete(auctionId)
        return next
      })
      delete clearFlashRef.current[auctionId]
    }, 1500)
  }, [])

  useEffect(() => {
    const unsubscribe = onBidUpdate(applyBidUpdate)
    return () => {
      unsubscribe()
      Object.values(clearFlashRef.current).forEach(clearTimeout)
      clearFlashRef.current = {}
    }
  }, [onBidUpdate, applyBidUpdate])

  // 초기 데이터 로드 및 상태 필터 변경 시 초기화
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        pageRef.current = 1
        
        await auctionApi.checkAllAuctionsStatus()
        const data = await auctionApi.getAuctions({
          page: 1,
          limit: PAGE_SIZE,
        })
        const visibleAuctions = filterVisibleAuctions(data)
        setAuctions(visibleAuctions)
        setHasMore(visibleAuctions.length === PAGE_SIZE)
      } catch {
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [auctionStatus, filterVisibleAuctions])

  // 상태 주기적 체크 (1분마다) - 첫 페이지만 새로고침
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await auctionApi.checkAllAuctionsStatus()
        // 첫 페이지만 새로고침 (무한 스크롤 중에는 방해하지 않음)
        if (pageRef.current === 1) {
          const data = await auctionApi.getAuctions({
            page: 1,
            limit: PAGE_SIZE,
          })
          setAuctions(filterVisibleAuctions(data))
        }
      } catch {
        // 상태 체크 실패 시 무시
      }
    }

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [auctionStatus, filterVisibleAuctions])

  // 더 많은 데이터 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = pageRef.current + 1
      const data = await auctionApi.getAuctions({
        page: nextPage,
        limit: PAGE_SIZE,
      })
      const visibleAuctions = filterVisibleAuctions(data)
      if (visibleAuctions.length === 0) {
        setHasMore(false)
      } else {
        setAuctions(prev => [...prev, ...visibleAuctions])
        setHasMore(visibleAuctions.length === PAGE_SIZE)
        pageRef.current = nextPage
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, filterVisibleAuctions])

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    // hasMore가 false이면 Observer 등록하지 않음
    if (!hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore()
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // 200px 전에 미리 로드 (더 빠른 로딩)
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    } else {
      const timeoutId = setTimeout(() => {
        if (observerTarget.current) observer.observe(observerTarget.current)
      }, 100)
      return () => clearTimeout(timeoutId)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  // 정렬된 경매 (API에서 이미 필터링된 데이터를 가져오므로 정렬만 수행)
  const sortedAuctions = useMemo(() => {
    // API에서 이미 필터링된 데이터를 가져오므로, 클라이언트에서는 정렬만 수행
    const sorted = [...auctions].sort((a, b) => {
      switch (auctionSort) {
        case 'latest':
          return b.id - a.id
        case 'ending':
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        case 'price':
          return b.currentPrice - a.currentPrice
        default:
          return 0
      }
    })
    return sorted
  }, [auctions, auctionSort])

  // 경매 데이터를 AuctionCard props로 변환
  const auctionCards = sortedAuctions.map((auction) => {
    const endTime = new Date(auction.endAt)
    const now = new Date()
    const distance = isNaN(endTime.getTime()) ? 0 : endTime.getTime() - now.getTime()

    let timeLeft = "종료됨"
    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        timeLeft = `${days}일 ${hours}시간`
      } else if (hours > 0) {
        timeLeft = `${hours}시간 ${minutes}분`
      } else {
        timeLeft = `${minutes}분`
      }
    }

    return {
      id: String(auction.id),
      title: auction.title,
      description: auction.summary || "",
      image: auction.imageUrl || "/placeholder.svg",
      category: "경매",
      currentBid: auction.currentPrice,
      bidCount: auction.bidCount ?? 0,
      timeLeft,
      isLive: auction.status === "RUNNING",
      status: auction.status,
      priceJustUpdated: priceJustUpdatedIds.has(auction.id),
    }
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">경매</h1>
          <p className="text-muted-foreground">모든 경매를 둘러보세요</p>
        </div>

        <FilterBar type="auction" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : auctionCards.length === 0 ? (
          auctionStatus !== 'ALL' || auctionSort !== 'latest' ? (
            <EmptyState
              icon={Gavel}
              title="필터 조건에 맞는 경매가 없습니다"
              description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
              action={{
                label: "필터 초기화",
                onClick: () => {
                  useFilterStore.getState().resetFilters()
                },
              }}
            />
          ) : (
            <EmptyState
              icon={Gavel}
              title="등록된 경매가 없습니다"
              description="첫 번째 경매를 등록해보세요"
              action={{
                label: "경매 등록하기",
                href: "/auction/create",
              }}
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {auctionCards.map((auction) => (
                <AuctionCard key={auction.id} {...auction} compact />
              ))}
            </div>
            
            {/* 무한 스크롤 트리거 - 항상 렌더링하여 Observer가 등록되도록 */}
            <div 
              ref={observerTarget} 
              className="flex items-center justify-center py-8 min-h-[200px]"
              style={{ visibility: hasMore ? 'visible' : 'hidden' }}
            >
              {loadingMore && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">더 많은 경매를 불러오는 중...</p>
                </div>
              )}
              {!loadingMore && hasMore && (
                <p className="text-sm text-muted-foreground">스크롤하여 더 보기</p>
              )}
            </div>
            {!hasMore && auctionCards.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">모든 경매를 불러왔습니다 (총 {auctionCards.length}개)</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
