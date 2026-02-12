"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Search, TrendingUp, Users, Zap, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/src/contexts/auth-context"
import { projectApi, searchApi, type SearchAutoCompleteResponse } from "@/src/services/api"
import { formatAmountShort } from "@/src/lib/format-amount"

export function HeroBanner() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchAutoCompleteResponse[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [statistics, setStatistics] = useState({
    totalAmount: 0,
    totalParticipants: 0,
    activeProjects: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // 통계 로드
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await projectApi.getStatistics()
        setStatistics(stats)
      } catch {
        // 통계 로드 실패 시 무시
      } finally {
        setLoadingStats(false)
      }
    }
    loadStatistics()
  }, [])

  // 자동완성 로드
  useEffect(() => {
    const loadSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const data = await searchApi.getSuggestions(searchQuery.trim())
          setSuggestions(data.slice(0, 5))
        } catch (error) {
          console.error("자동완성 로드 실패:", error)
          setSuggestions([])
        }
      } else {
        setSuggestions([])
      }
    }

    const timer = setTimeout(loadSuggestions, 300)
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

  const popularCategories = [
    { name: "테크", href: "/?category=tech" },
    { name: "디자인", href: "/?category=design" },
    { name: "음식", href: "/?category=food" },
    { name: "패션", href: "/?category=fashion" },
    { name: "뷰티", href: "/?category=beauty" },
  ]

  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 to-background px-4 py-12 md:py-16">
      <div className="container mx-auto">
        {/* 검색바 */}
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="새로운 일상이 필요하신가요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-14 rounded-full border-2 border-primary/20 bg-background pl-12 pr-4 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
              />
              <Button
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6"
              >
                검색
              </Button>

              {/* 자동완성 드롭다운 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-2xl border-2 border-primary/20 bg-background shadow-2xl z-50 overflow-hidden">
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                      <Sparkles className="size-4 text-primary" />
                      <span>추천 검색어</span>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion.title)}
                        className="w-full rounded-xl px-4 py-3 text-left hover:bg-primary/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Search className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="font-medium group-hover:text-primary transition-colors">{suggestion.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* 인기 카테고리 */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-muted-foreground">인기 카테고리</p>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </div>
              {loadingStats ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">
                  {statistics.totalAmount > 0 ? formatAmountShort(statistics.totalAmount) : "0"}
                </div>
              )}
              <div className="text-xs text-muted-foreground">누적 후원금액</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Users className="size-5 text-primary" />
              </div>
              {loadingStats ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">{statistics.totalParticipants.toLocaleString()}</div>
              )}
              <div className="text-xs text-muted-foreground">참여자 수</div>
            </div>
            <div className="text-center">
              <div className="mb-2 flex items-center justify-center">
                <Zap className="size-5 text-primary" />
              </div>
              {loadingStats ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">{statistics.activeProjects.toLocaleString()}</div>
              )}
              <div className="text-xs text-muted-foreground">진행 중인 프로젝트</div>
            </div>
          </div>

          {/* CTA 버튼 (로그인한 경우만) */}
          {isAuthenticated && (
            <div className="mt-6 flex justify-center gap-3">
              <Button size="lg" variant="outline" asChild>
                <Link href="/auction/create">경매 등록</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/project/create">프로젝트 시작하기</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
