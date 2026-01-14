"use client"

import { Navigation } from "@/src/components/navigation"
import { AuctionCard } from "@/src/components/auction-card"
import { EmptyState } from "@/src/components/empty-state"
import { FilterBar } from "@/src/components/filter-bar"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { auctionApi } from "@/src/services/api"
import { AuctionResponse } from "@/src/types/api"
import { useFilterStore, filterAndSortAuctions } from "@/src/stores/filterStore"
import { Loader2, Gavel } from "lucide-react"

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(1)
  const observerTarget = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 20
  
  const { auctionStatus, auctionSort } = useFilterStore()

  // 초기 데이터 로드 및 필터/정렬 변경 시 초기화
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        pageRef.current = 1
        
        await auctionApi.checkAllAuctionsStatus()
        const data = await auctionApi.getAuctions({ 
          page: 1, 
          limit: PAGE_SIZE, 
          status: auctionStatus === 'ALL' ? undefined : auctionStatus 
        })
        
        console.log(`[AuctionsPage] 로드된 데이터: ${data.length}개, 페이지: 1`)
        setAuctions(data)
        setHasMore(data.length === PAGE_SIZE)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [auctionStatus, auctionSort])

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
            status: auctionStatus === 'ALL' ? undefined : auctionStatus
          })
          setAuctions(data)
        }
      } catch (error) {
        console.error("상태 체크 실패:", error)
      }
    }

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [auctionStatus])

  // 더 많은 데이터 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log(`[AuctionsPage] loadMore 스킵: loadingMore=${loadingMore}, hasMore=${hasMore}`)
      return
    }

    try {
      setLoadingMore(true)
      const nextPage = pageRef.current + 1
      
      console.log(`[AuctionsPage] 다음 페이지 로드 시작: 페이지 ${nextPage}`)
      const data = await auctionApi.getAuctions({ 
        page: nextPage, 
        limit: PAGE_SIZE,
        status: auctionStatus === 'ALL' ? undefined : auctionStatus
      })
      
      console.log(`[AuctionsPage] 페이지 ${nextPage} 로드 완료: ${data.length}개`)
      
      if (data.length === 0) {
        console.log(`[AuctionsPage] 더 이상 데이터 없음`)
        setHasMore(false)
      } else {
        setAuctions(prev => {
          const updated = [...prev, ...data]
          console.log(`[AuctionsPage] 총 경매 수: ${updated.length}개`)
          return updated
        })
        setHasMore(data.length === PAGE_SIZE)
        pageRef.current = nextPage
      }
    } catch (error) {
      console.error("추가 데이터 로드 실패:", error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, auctionStatus])

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    // hasMore가 false이면 Observer 등록하지 않음
    if (!hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting
        console.log(`[AuctionsPage] Observer: intersecting=${isIntersecting}, hasMore=${hasMore}, loadingMore=${loadingMore}`)
        
        if (isIntersecting && hasMore && !loadingMore) {
          console.log(`[AuctionsPage] 트리거 감지! loadMore 호출`)
          loadMore()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // 200px 전에 미리 로드 (더 빠른 로딩)
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      console.log(`[AuctionsPage] Observer 등록됨`)
      observer.observe(currentTarget)
    } else {
      console.warn(`[AuctionsPage] Observer 타겟이 없음 - 잠시 후 재시도`)
      // 타겟이 아직 렌더링되지 않았을 수 있으므로 짧은 지연 후 재시도
      const timeoutId = setTimeout(() => {
        if (observerTarget.current) {
          observer.observe(observerTarget.current)
          console.log(`[AuctionsPage] Observer 재등록 성공`)
        }
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
      description: auction.description,
      image: auction.imageUrl || "/placeholder.svg",
      category: "경매",
      currentBid: auction.currentPrice,
      bidCount: 0,
      timeLeft,
      isLive: auction.status === "RUNNING",
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
              {auctionCards.map((auction) => (
                <AuctionCard key={auction.id} {...auction} />
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
