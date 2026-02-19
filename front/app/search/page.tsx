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
import { searchApi, type ProjectSearchResponse, type AuctionSearchResponse, type SearchAutoCompleteResponse } from "@/src/services/api"
import { useFilterStore } from "@/src/stores/filterStore"
import { Loader2, Search, Package, Gavel, Sparkles } from "lucide-react"

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(query)
  const [projects, setProjects] = useState<ProjectSearchResponse[]>([])
  const [auctions, setAuctions] = useState<AuctionSearchResponse[]>([])
  const [suggestions, setSuggestions] = useState<SearchAutoCompleteResponse[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "projects" | "auctions">("all")
  
  // Zustand 필터 상태
  const { projectStatus, projectSort, auctionStatus, auctionSort } = useFilterStore()

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useEffect(() => {
    if (!query.trim()) {
      setProjects([])
      setAuctions([])
      return
    }
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const [projectsData, auctionsData] = await Promise.allSettled([
          searchApi.searchProjects(query.trim()),
          searchApi.searchAuctions(query.trim()),
        ])
        if (cancelled) return
        setProjects(projectsData.status === 'fulfilled' ? projectsData.value : [])
        setAuctions(auctionsData.status === 'fulfilled' ? auctionsData.value : [])
        if (projectsData.status === 'rejected') console.error('프로젝트 검색 실패:', projectsData.reason)
        if (auctionsData.status === 'rejected') console.error('경매 검색 실패:', auctionsData.reason)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [query])

  // 자동완성
  useEffect(() => {
    const loadSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const data = await searchApi.getSuggestions(searchQuery.trim())
          setSuggestions(data.slice(0, 5)) // 최대 5개
        } catch (error) {
          console.error("자동완성 로드 실패:", error)
          setSuggestions([])
        }
      } else {
        setSuggestions([])
      }
    }

    const timer = setTimeout(loadSuggestions, 300) // 300ms 디바운스
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  // 검색 결과는 이미 백엔드에서 필터링되어 오므로 클라이언트 필터 불필요
  const filteredProjects = projects
  const filteredAuctions = auctions

  // 프로젝트 데이터를 ProjectCard props로 변환
  const projectCards = filteredProjects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    const daysLeft = isNaN(endTime.getTime())
      ? 0
      : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: String(project.id),
      title: project.title,
      description: project.title, // 검색 결과는 description 없음
      image: project.thumbnailUrl || "/placeholder.svg",
      category: "프로젝트",
      currentAmount: project.currentAmount,
      goalAmount: project.targetAmount,
      backers: 0, // 검색 결과는 backers 없음
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

    // S3 이미지 URL 변환
    const imageUrl = auction.imageKey 
      ? `https://ddip-image.s3.ap-northeast-2.amazonaws.com/${auction.imageKey}`
      : "/placeholder.svg"

    return {
      id: String(auction.id),
      title: auction.title,
      description: auction.description,
      image: imageUrl,
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
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-14 rounded-full border-2 border-primary/20 bg-background pl-12 pr-24 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
              >
                검색
              </Button>
              
              {/* 자동완성 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-xl z-10">
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Sparkles className="size-4" />
                      <span>추천 검색어</span>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion.title)}
                        className="w-full rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="size-4 text-muted-foreground" />
                          <span>{suggestion.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="mb-6 flex items-center justify-between">
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
                      <Package className="mr-2 size-4" />
                      프로젝트 ({filteredProjects.length})
                    </TabsTrigger>
                    <TabsTrigger value="auctions">
                      <Gavel className="mr-2 size-4" />
                      경매 ({filteredAuctions.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* 전체 결과 */}
                  <TabsContent value="all" className="mt-6">
                    {totalResults === 0 ? (
                      <EmptyState
                        icon={Search}
                        title="검색 결과가 없습니다"
                        description="다른 키워드로 검색해보세요"
                      />
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
                      <EmptyState
                        icon={Package}
                        title="프로젝트 검색 결과가 없습니다"
                        description="다른 키워드로 검색해보세요"
                      />
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
                      <EmptyState
                        icon={Gavel}
                        title="경매 검색 결과가 없습니다"
                        description="다른 키워드로 검색해보세요"
                      />
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
