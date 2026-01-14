"use client"

import { Navigation } from "@/src/components/navigation"
import { HeroBanner } from "@/src/components/hero-banner"
import { ProjectCard } from "@/src/components/project-card"
import { AuctionCard } from "@/src/components/auction-card"
import { EmptyState } from "@/src/components/empty-state"
import { Button } from "@/src/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { projectApi, auctionApi } from "@/src/services/api"
import { ProjectResponse, AuctionResponse } from "@/src/types/api"
import { Loader2, Package, Gavel, Clock, ArrowRight, Sparkles } from "lucide-react"

export default function HomePage() {
  const [popularProjects, setPopularProjects] = useState<ProjectResponse[]>([])
  const [popularAuctions, setPopularAuctions] = useState<AuctionResponse[]>([])
  const [urgentProjects, setUrgentProjects] = useState<ProjectResponse[]>([])
  const [urgentAuctions, setUrgentAuctions] = useState<AuctionResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // 모든 프로젝트와 경매의 상태 일괄 체크
        await Promise.all([
          projectApi.checkAllProjectsStatus(),
          auctionApi.checkAllAuctionsStatus(),
        ])
        
        // 인기 프로젝트/경매 로드 (인기순 정렬, 각 8개)
        const [allProjects, allAuctions] = await Promise.all([
          projectApi.getProjects({ limit: 50 }),
          auctionApi.getAuctions({ limit: 50 }),
        ])
        
        // 인기 프로젝트: 후원자 수 기준 정렬
        const sortedByPopularity = [...allProjects].sort((a, b) => {
          const backersA = a.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          const backersB = b.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          return backersB - backersA
        })
        setPopularProjects(sortedByPopularity.slice(0, 8))
        
        // 인기 경매: 입찰 수 기준 (현재는 ID 순으로 대체)
        const sortedAuctions = [...allAuctions].sort((a, b) => b.id - a.id)
        setPopularAuctions(sortedAuctions.slice(0, 8))
        
        // 마감 임박 프로젝트: 24시간 이내 마감
        const now = new Date().getTime()
        const urgentProj = allProjects.filter(project => {
          const endTime = new Date(project.endAt).getTime()
          const hoursLeft = (endTime - now) / (1000 * 60 * 60)
          return hoursLeft <= 24 && hoursLeft > 0 && project.status === 'OPEN'
        })
        urgentProj.sort((a, b) => {
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB // 마감 임박순
        })
        setUrgentProjects(urgentProj.slice(0, 8))
        
        // 마감 임박 경매: 24시간 이내 마감
        const urgentAuc = allAuctions.filter(auction => {
          const endTime = new Date(auction.endAt).getTime()
          const hoursLeft = (endTime - now) / (1000 * 60 * 60)
          return hoursLeft <= 24 && hoursLeft > 0 && (auction.status === 'RUNNING' || auction.status === 'SCHEDULED')
        })
        urgentAuc.sort((a, b) => {
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        })
        setUrgentAuctions(urgentAuc.slice(0, 8))
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 상태 주기적 체크 (1분마다)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await Promise.all([
          projectApi.checkAllProjectsStatus(),
          auctionApi.checkAllAuctionsStatus(),
        ])
        
        // 데이터 새로고침
        const [allProjects, allAuctions] = await Promise.all([
          projectApi.getProjects({ limit: 50 }),
          auctionApi.getAuctions({ limit: 50 }),
        ])
        
        // 인기 프로젝트 정렬
        const sortedByPopularity = [...allProjects].sort((a, b) => {
          const backersA = a.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          const backersB = b.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          return backersB - backersA
        })
        setPopularProjects(sortedByPopularity.slice(0, 8))
        
        const sortedAuctions = [...allAuctions].sort((a, b) => b.id - a.id)
        setPopularAuctions(sortedAuctions.slice(0, 8))
        
        // 마감 임박 항목 업데이트
        const now = new Date().getTime()
        const urgentProj = allProjects.filter(project => {
          const endTime = new Date(project.endAt).getTime()
          const hoursLeft = (endTime - now) / (1000 * 60 * 60)
          return hoursLeft <= 24 && hoursLeft > 0 && project.status === 'OPEN'
        })
        urgentProj.sort((a, b) => {
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        })
        setUrgentProjects(urgentProj.slice(0, 8))
        
        const urgentAuc = allAuctions.filter(auction => {
          const endTime = new Date(auction.endAt).getTime()
          const hoursLeft = (endTime - now) / (1000 * 60 * 60)
          return hoursLeft <= 24 && hoursLeft > 0 && (auction.status === 'RUNNING' || auction.status === 'SCHEDULED')
        })
        urgentAuc.sort((a, b) => {
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        })
        setUrgentAuctions(urgentAuc.slice(0, 8))
      } catch (error) {
        console.error("상태 체크 실패:", error)
      }
    }

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  // 프로젝트 데이터를 ProjectCard props로 변환
  const popularProjectCards = popularProjects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    // 날짜 유효성 검사
    const daysLeft = isNaN(endTime.getTime()) 
      ? 0 
      : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const backers = project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)

    return {
      id: String(project.id),
      title: project.title,
      description: project.description,
      image: project.imageUrl || "/placeholder.svg",
      category: "프로젝트", // 카테고리는 API에 없으므로 기본값 사용
      currentAmount: project.currentAmount,
      goalAmount: project.targetAmount,
      backers,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    }
  })

  // 마감 임박 프로젝트 카드
  const urgentProjectCards = urgentProjects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    const daysLeft = isNaN(endTime.getTime()) 
      ? 0 
      : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const backers = project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)

    return {
      id: String(project.id),
      title: project.title,
      description: project.description,
      image: project.imageUrl || "/placeholder.svg",
      category: "프로젝트",
      currentAmount: project.currentAmount,
      goalAmount: project.targetAmount,
      backers,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    }
  })

  // 인기 경매 카드
  const popularAuctionCards = popularAuctions.map((auction) => {
    const endTime = new Date(auction.endAt)
    const now = new Date()
    // 날짜 유효성 검사
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
      bidCount: 0, // API에 입찰 횟수 필드가 없으므로 기본값 사용
      timeLeft,
      isLive: auction.status === "RUNNING",
    }
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroBanner />

      <main className="container mx-auto px-4 py-12">
        {/* 마감 임박 긴급성 섹션 */}
        {(urgentProjects.length > 0 || urgentAuctions.length > 0) && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="size-6 text-destructive" />
                  <h2 className="text-2xl font-bold">지금 아니면 놓쳐요!</h2>
                </div>
                <p className="text-muted-foreground">24시간 이내 마감되는 프로젝트와 경매</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-8">
                {urgentProjects.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="size-5" />
                        마감 임박 프로젝트
                      </h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {urgentProjectCards.map((project) => (
                        <ProjectCard key={project.id} {...project} />
                      ))}
                    </div>
                  </div>
                )}
                
                {urgentAuctions.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Gavel className="size-5" />
                        마감 임박 경매
                      </h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {urgentAuctions.map((auction) => {
                        const endTime = new Date(auction.endAt)
                        const now = new Date()
                        const distance = isNaN(endTime.getTime()) ? 0 : endTime.getTime() - now.getTime()
                        let timeLeft = "종료됨"
                        if (distance > 0) {
                          const hours = Math.floor(distance / (1000 * 60 * 60))
                          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                          if (hours > 0) {
                            timeLeft = `${hours}시간 ${minutes}분`
                          } else {
                            timeLeft = `${minutes}분`
                          }
                        }
                        return (
                          <AuctionCard
                            key={auction.id}
                            id={String(auction.id)}
                            title={auction.title}
                            description={auction.description}
                            image={auction.imageUrl || "/placeholder.svg"}
                            category="경매"
                            currentBid={auction.currentPrice}
                            bidCount={0}
                            timeLeft={timeLeft}
                            isLive={auction.status === "RUNNING"}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 인기 프로젝트 섹션 */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">인기 프로젝트</h2>
              <p className="text-muted-foreground">지금 가장 핫한 크라우드펀딩 프로젝트를 만나보세요</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/projects">
                전체보기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : popularProjectCards.length === 0 ? (
            <EmptyState
              icon={Package}
              title="등록된 프로젝트가 없습니다"
              description="첫 번째 크라우드펀딩 프로젝트를 시작해보세요"
              action={{
                label: "프로젝트 등록하기",
                href: "/project/create",
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popularProjectCards.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          )}
        </section>

        {/* 인기 경매 섹션 */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">인기 경매</h2>
              <p className="text-muted-foreground">지금 실시간으로 진행 중인 경매에 참여하세요</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/auctions">
                전체보기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : popularAuctionCards.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="등록된 경매가 없습니다"
              description="첫 번째 경매를 등록해보세요"
              action={{
                label: "경매 등록하기",
                href: "/auction/create",
              }}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popularAuctionCards.map((auction) => (
                <AuctionCard key={auction.id} {...auction} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold">DDIP</h3>
              <p className="text-sm text-muted-foreground">혁신적인 아이디어와 특별한 제품을 만나는 공간</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>크라우드펀딩</li>
                <li>경매</li>
                <li>프로젝트 시작하기</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>고객센터</li>
                <li>가이드</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>소개</li>
                <li>이용약관</li>
                <li>개인정보처리방침</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            © 2026 DDIP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
