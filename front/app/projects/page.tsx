"use client"

import { Navigation } from "@/src/components/navigation"
import { ProjectCard } from "@/src/components/project-card"
import { EmptyState } from "@/src/components/empty-state"
import { FilterBar } from "@/src/components/filter-bar"
import { Button } from "@/src/components/ui/button"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { projectApi } from "@/src/services/api"
import { ProjectResponse } from "@/src/types/api"
import { useFilterStore, filterAndSortProjects } from "@/src/stores/filterStore"
import { Loader2, Package } from "lucide-react"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageRef = useRef(1)
  const observerTarget = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 20
  
  const { projectStatus, projectSort } = useFilterStore()

  // 초기 데이터 로드 및 필터/정렬 변경 시 초기화
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        pageRef.current = 1
        
        await projectApi.checkAllProjectsStatus()
        const data = await projectApi.getProjects({ 
          page: 1, 
          limit: PAGE_SIZE, 
          status: projectStatus === 'ALL' ? undefined : projectStatus 
        })
        setProjects(data)
        const hasMoreData = data.length === PAGE_SIZE
        setHasMore(hasMoreData)
      } catch {
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [projectStatus, projectSort])

  // 상태 주기적 체크 (1분마다) - 첫 페이지만 새로고침
  useEffect(() => {
    const checkStatus = async () => {
      try {
        await projectApi.checkAllProjectsStatus()
        // 첫 페이지만 새로고침 (무한 스크롤 중에는 방해하지 않음)
        if (pageRef.current === 1) {
          const data = await projectApi.getProjects({ 
            page: 1, 
            limit: PAGE_SIZE,
            status: projectStatus === 'ALL' ? undefined : projectStatus
          })
          setProjects(data)
        }
      } catch {
        // 상태 체크 실패 시 무시
      }
    }

    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [projectStatus])

  // 더 많은 데이터 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = pageRef.current + 1
      const data = await projectApi.getProjects({ 
        page: nextPage, 
        limit: PAGE_SIZE,
        status: projectStatus === 'ALL' ? undefined : projectStatus
      })
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setProjects(prev => [...prev, ...data])
        setHasMore(data.length === PAGE_SIZE)
        pageRef.current = nextPage
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, projectStatus])

  // Intersection Observer로 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore()
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // 200px 전에 미리 로드 (더 빠른 로딩)
      }
    )

    // 타겟이 렌더링될 때까지 기다림
    const setupObserver = () => {
      const currentTarget = observerTarget.current
      if (currentTarget) {
        observer.observe(currentTarget)
        return true
      }
      return false
    }

    if (!setupObserver()) {
      const timeoutId = setTimeout(() => setupObserver(), 200)
      
      return () => {
        clearTimeout(timeoutId)
        if (observerTarget.current) {
          observer.unobserve(observerTarget.current)
        }
      }
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loadingMore, loadMore, projects.length])

  // 정렬된 프로젝트 (API에서 이미 필터링된 데이터를 가져오므로 정렬만 수행)
  const sortedProjects = useMemo(() => {
    // API에서 이미 필터링된 데이터를 가져오므로, 클라이언트에서는 정렬만 수행
    const sorted = [...projects].sort((a, b) => {
      switch (projectSort) {
        case 'latest':
          return b.id - a.id // ID가 타임스탬프이므로 큰 순서대로
        case 'popular':
          // 후원자 수 기준
          const backersA = a.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          const backersB = b.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
          return backersB - backersA
        case 'ending':
          // 마감 임박순
          const endTimeA = new Date(a.endAt).getTime()
          const endTimeB = new Date(b.endAt).getTime()
          return endTimeA - endTimeB
        case 'amount':
          // 모금액 순
          return b.currentAmount - a.currentAmount
        default:
          return 0
      }
    })
    return sorted
  }, [projects, projectSort])

  // 프로젝트 데이터를 ProjectCard props로 변환
  const projectCards = sortedProjects.map((project) => {
    const endTime = new Date(project.endAt)
    const now = new Date()
    const daysLeft = isNaN(endTime.getTime()) 
      ? 0 
      : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const backers = ((project.rewardTiers ?? []).reduce((sum, tier) => sum + tier.soldQuantity, 0) || project.backerCount) ?? 0

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
      status: project.status,
    }
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">크라우드펀딩 프로젝트</h1>
          <p className="text-muted-foreground">모든 크라우드펀딩 프로젝트를 둘러보세요</p>
        </div>

        <FilterBar type="project" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : projectCards.length === 0 ? (
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
          ) : (
            <EmptyState
              icon={Package}
              title="등록된 프로젝트가 없습니다"
              description="첫 번째 크라우드펀딩 프로젝트를 시작해보세요"
              action={{
                label: "프로젝트 등록하기",
                href: "/project/create",
              }}
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {projectCards.map((project) => (
                <ProjectCard key={project.id} {...project} compact />
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
                  <p className="text-sm text-muted-foreground">더 많은 프로젝트를 불러오는 중...</p>
                </div>
              )}
              {!loadingMore && hasMore && (
                <p className="text-sm text-muted-foreground">스크롤하여 더 보기</p>
              )}
            </div>
            {!hasMore && projectCards.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">모든 프로젝트를 불러왔습니다 (총 {projectCards.length}개)</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
