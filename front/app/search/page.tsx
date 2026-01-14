"use client"

import { Navigation } from "@/src/components/navigation"
import { ProjectCard } from "@/src/components/project-card"
import { AuctionCard } from "@/src/components/auction-card"
import { EmptyState } from "@/src/components/empty-state"
import { FilterBar } from "@/src/components/filter-bar"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Input } from "@/src/components/ui/input"
import { useState, useEffect, Suspense, use, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { projectApi, auctionApi } from "@/src/services/api"
import { ProjectResponse, AuctionResponse } from "@/src/types/api"
import { useFilterStore, filterAndSortProjects, filterAndSortAuctions } from "@/src/stores/filterStore"
import { Loader2, Search, Package, Gavel } from "lucide-react"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(query)
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [auctions, setAuctions] = useState<AuctionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "projects" | "auctions">("all")
  
  // Zustand 필터 상태
  const { projectStatus, projectSort, auctionStatus, auctionSort } = useFilterStore()

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useEffect(() => {
    if (query.trim()) {
      performSearch(query)
    } else {
      setProjects([])
      setAuctions([])
    }
  }, [query])

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProjects([])
      setAuctions([])
      return
    }

    setLoading(true)
    try {
      const [projectsData, auctionsData] = await Promise.all([
        projectApi.searchProjects(searchTerm, { limit: 50 }),
        auctionApi.searchAuctions(searchTerm, { limit: 50 }),
      ])
      setProjects(projectsData)
      setAuctions(auctionsData)
    } catch (error) {
      console.error("검색 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // 필터링 및 정렬된 프로젝트
  const filteredProjects = useMemo(() => {
    return filterAndSortProjects(projects, projectStatus, projectSort)
  }, [projects, projectStatus, projectSort])
  
  // 필터링 및 정렬된 경매
  const filteredAuctions = useMemo(() => {
    return filterAndSortAuctions(auctions, auctionStatus, auctionSort)
  }, [auctions, auctionStatus, auctionSort])

  // 프로젝트 데이터를 ProjectCard props로 변환
  const projectCards = filteredProjects.map((project) => {
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
      category: project.categoryPath || "프로젝트",
      currentAmount: project.currentAmount,
      goalAmount: project.targetAmount,
      backers,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
    }
  })

  // 경매 데이터를 AuctionCard props로 변환
  const auctionCards = filteredAuctions.map((auction) => {
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

  const totalResults = filteredProjects.length + filteredAuctions.length

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* 검색바 */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="프로젝트나 경매를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-full border-2 border-primary/20 bg-background pl-12 pr-24 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
              >
                검색
              </Button>
            </div>
          </form>
        </div>

        {/* 검색 결과 */}
        {query.trim() ? (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* 결과 통계 */}
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">"{query}"</span>에 대한 검색 결과{" "}
                    <span className="font-semibold text-foreground">{totalResults}개</span>
                  </p>
                </div>

                {/* 탭 */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
                  <TabsList>
                    <TabsTrigger value="all">
                      전체 ({totalResults})
                    </TabsTrigger>
                    <TabsTrigger value="projects">
                      프로젝트 ({filteredProjects.length})
                    </TabsTrigger>
                    <TabsTrigger value="auctions">
                      경매 ({filteredAuctions.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* 전체 결과 */}
                  <TabsContent value="all" className="mt-6">
                    {totalResults === 0 ? (
                      // 필터가 활성화되어 있는지 확인
                      (projectStatus !== 'ALL' || projectSort !== 'latest' || auctionStatus !== 'ALL' || auctionSort !== 'latest') ? (
                        <EmptyState
                          icon={Search}
                          title="필터 조건에 맞는 검색 결과가 없습니다"
                          description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
                          action={{
                            label: "필터 초기화",
                            onClick: () => {
                              useFilterStore.getState().resetFilters()
                            },
                          }}
                        />
                      ) : (projects.length === 0 && auctions.length === 0) ? (
                        <EmptyState
                          icon={Search}
                          title="검색 결과가 없습니다"
                          description="다른 키워드로 검색해보세요"
                        />
                      ) : (
                        <EmptyState
                          icon={Search}
                          title="검색 결과는 있지만 필터 조건에 맞는 항목이 없습니다"
                          description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
                          action={{
                            label: "필터 초기화",
                            onClick: () => {
                              useFilterStore.getState().resetFilters()
                            },
                          }}
                        />
                      )
                    ) : (
                      <div className="space-y-8">
                        {/* 프로젝트 섹션 */}
                        {filteredProjects.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Package className="size-5 text-primary" />
                              <h2 className="text-xl font-semibold">프로젝트 ({filteredProjects.length})</h2>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {projectCards.map((project) => (
                                <ProjectCard key={project.id} {...project} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 경매 섹션 */}
                        {filteredAuctions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Gavel className="size-5 text-primary" />
                              <h2 className="text-xl font-semibold">경매 ({filteredAuctions.length})</h2>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {auctionCards.map((auction) => (
                                <AuctionCard key={auction.id} {...auction} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* 프로젝트만 */}
                  <TabsContent value="projects" className="mt-6">
                    {filteredProjects.length === 0 ? (
                      // 필터가 활성화되어 있는지 확인
                      projectStatus !== 'ALL' || projectSort !== 'latest' ? (
                        <EmptyState
                          icon={Package}
                          title="필터 조건에 맞는 프로젝트가 없습니다"
                          description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
                          action={{
                            label: "필터 초기화",
                            onClick: () => {
                              useFilterStore.getState().resetFilters()
                            },
                          }}
                        />
                      ) : projects.length === 0 ? (
                        <EmptyState
                          icon={Package}
                          title="프로젝트 검색 결과가 없습니다"
                          description="다른 키워드로 검색해보세요"
                        />
                      ) : (
                        <EmptyState
                          icon={Package}
                          title="검색 결과는 있지만 필터 조건에 맞는 프로젝트가 없습니다"
                          description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
                          action={{
                            label: "필터 초기화",
                            onClick: () => {
                              useFilterStore.getState().resetFilters()
                            },
                          }}
                        />
                      )
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projectCards.map((project) => (
                          <ProjectCard key={project.id} {...project} />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* 경매만 */}
                  <TabsContent value="auctions" className="mt-6">
                    {filteredAuctions.length === 0 ? (
                      // 필터가 활성화되어 있는지 확인
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
                      ) : auctions.length === 0 ? (
                        <EmptyState
                          icon={Gavel}
                          title="경매 검색 결과가 없습니다"
                          description="다른 키워드로 검색해보세요"
                        />
                      ) : (
                        <EmptyState
                          icon={Gavel}
                          title="검색 결과는 있지만 필터 조건에 맞는 경매가 없습니다"
                          description="다른 필터 조건을 선택하거나 필터를 초기화해보세요"
                          action={{
                            label: "필터 초기화",
                            onClick: () => {
                              useFilterStore.getState().resetFilters()
                            },
                          }}
                        />
                      )
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {auctionCards.map((auction) => (
                          <AuctionCard key={auction.id} {...auction} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="검색어를 입력해주세요"
            description="프로젝트나 경매의 제목, 설명, 태그를 검색할 수 있습니다"
          />
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
