"use client"

import { Navigation } from "@/src/components/navigation"
import { HeroBanner } from "@/src/components/hero-banner"
import { ProjectCard } from "@/src/components/project-card"
import { AuctionCard } from "@/src/components/auction-card"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { useState, useEffect } from "react"
import { projectApi, auctionApi } from "@/src/services/api"
import { ProjectResponse, AuctionResponse } from "@/src/types/api"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [auctions, setAuctions] = useState<AuctionResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 프로젝트와 경매 데이터를 동시에 로드
        const [projectsData, auctionsData] = await Promise.all([
          projectApi.getProjects({ status: "OPEN", limit: 4 }),
          auctionApi.getAuctions({ status: "RUNNING", limit: 4 }),
        ])
        setProjects(projectsData)
        setAuctions(auctionsData)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 프로젝트 데이터를 ProjectCard props로 변환
  const projectCards = projects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    const daysLeft = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

  // 경매 데이터를 AuctionCard props로 변환
  const auctionCards = auctions.map((auction) => {
    const endTime = new Date(auction.endAt)
    const now = new Date()
    const distance = endTime.getTime() - now.getTime()

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
        <Tabs defaultValue="projects" className="w-full">
          <div className="mb-8 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="projects" className="text-base">
                크라우드펀딩
              </TabsTrigger>
              <TabsTrigger value="auctions" className="text-base">
                진행 중인 경매
              </TabsTrigger>
            </TabsList>

            <Button variant="outline">전체보기</Button>
          </div>

          <TabsContent value="projects" className="mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">인기 프로젝트</h2>
              <p className="text-muted-foreground">지금 가장 핫한 크라우드펀딩 프로젝트를 만나보세요</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projectCards.map((project) => (
                  <ProjectCard key={project.id} {...project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions" className="mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">라이브 경매</h2>
              <p className="text-muted-foreground">지금 실시간으로 진행 중인 경매에 참여하세요</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {auctionCards.map((auction) => (
                  <AuctionCard key={auction.id} {...auction} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-bold">FundIt</h3>
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
            © 2026 FundIt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
