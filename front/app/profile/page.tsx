"use client"

import { Navigation } from "@/src/components/navigation"
import { EmptyState } from "@/src/components/empty-state"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Separator } from "@/src/components/ui/separator"
import { Loader2, Calendar, TrendingUp, Gavel, Heart, Package, Edit, X } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { projectApi, auctionApi } from "@/src/services/api"
import { ProjectResponse, AuctionResponse, SupportResponse, BidResponse } from "@/src/types/api"
import { getWishlist } from "@/src/lib/wishlist"
import { canEditProject, canCancelProject, canEditAuction, canCancelAuction } from "@/src/lib/permissions"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

function ProfileTabs({ defaultTab }: { defaultTab: string }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [myProjects, setMyProjects] = useState<ProjectResponse[]>([])
  const [myAuctions, setMyAuctions] = useState<AuctionResponse[]>([])
  const [mySupports, setMySupports] = useState<SupportResponse[]>([])
  const [myBids, setMyBids] = useState<BidResponse[]>([])
  const [favoriteProjects, setFavoriteProjects] = useState<ProjectResponse[]>([])
  const [favoriteAuctions, setFavoriteAuctions] = useState<AuctionResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadMyData()
    }
  }, [authLoading, isAuthenticated])

  const loadMyData = async () => {
    try {
      setLoading(true)
      
      // 사용자 ID 확인
      if (!user?.id) {
        toast.error("사용자 정보를 불러올 수 없습니다")
        return
      }
      
      const userId = user.id
      
      // 등록한 프로젝트/경매는 현재 사용자가 생성자인 것만 필터링
      const allProjects = await projectApi.getProjects()
      const allAuctions = await auctionApi.getAuctions()
      
      const myProjectsList = allProjects.filter(p => p.creator.id === userId)
      const myAuctionsList = allAuctions.filter(a => a.seller.id === userId)
      
      setMyProjects(myProjectsList)
      setMyAuctions(myAuctionsList)
      
      // 후원/입찰 내역
      const supports = await projectApi.getMySupports(userId)
      const bids = await auctionApi.getMyBids(userId)
      
      setMySupports(supports)
      setMyBids(bids)
      
      // 찜한 항목 로드
      const wishlist = getWishlist()
      const favoriteProjectIds = wishlist
        .filter(item => item.type === "project")
        .map(item => item.id)
      const favoriteAuctionIds = wishlist
        .filter(item => item.type === "auction")
        .map(item => item.id)
      
      const favoriteProjectsList = allProjects.filter(p => favoriteProjectIds.includes(p.id))
      const favoriteAuctionsList = allAuctions.filter(a => favoriteAuctionIds.includes(a.id))
      
      setFavoriteProjects(favoriteProjectsList)
      setFavoriteAuctions(favoriteAuctionsList)
    } catch (error) {
      console.error("데이터 로드 실패:", error)
      toast.error("데이터를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">로그인이 필요합니다</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">마이페이지</h1>
            <p className="text-muted-foreground">내 프로젝트, 경매, 후원 내역을 관리하세요</p>
          </div>

          {/* 프로필 정보 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.nickname || ""} />
                  <AvatarFallback className="text-lg">
                    {user?.nickname?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{user?.nickname}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">{user?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 탭 */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="projects">내 프로젝트</TabsTrigger>
              <TabsTrigger value="auctions">내 경매</TabsTrigger>
              <TabsTrigger value="supports">후원 내역</TabsTrigger>
              <TabsTrigger value="bids">입찰 내역</TabsTrigger>
              <TabsTrigger value="favorites">찜한 항목</TabsTrigger>
            </TabsList>

            {/* 내 프로젝트 */}
            <TabsContent value="projects" className="mt-6">
              <div className="space-y-4">
                {myProjects.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="등록한 프로젝트가 없습니다"
                    action={{
                      label: "프로젝트 등록하기",
                      href: "/project/create",
                    }}
                  />
                ) : (
                  myProjects.map((project) => {
                    const handleCancelProject = async () => {
                      if (!confirm("정말로 이 프로젝트를 취소하시겠습니까? 취소된 프로젝트는 복구할 수 없습니다.")) {
                        return
                      }

                      try {
                        await projectApi.updateProject(project.id, {
                          status: "CANCELED" as const,
                        })
                        toast.success("프로젝트가 취소되었습니다")
                        // 프로젝트 목록 새로고침
                        const allProjects = await projectApi.getProjects()
                        const myProjectsList = allProjects.filter(p => p.creator.id === user?.id)
                        setMyProjects(myProjectsList)
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "프로젝트 취소에 실패했습니다")
                      }
                    }

                    return (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <Link href={`/project/${project.id}`} className="flex-1">
                              <div className="flex gap-4">
                                <div className="relative size-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={project.imageUrl || "/placeholder.svg"}
                                    alt={project.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-lg mb-1 truncate">{project.title}</h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {project.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="text-muted-foreground">
                                          목표: {project.targetAmount.toLocaleString()}원
                                        </span>
                                        <span className="text-primary font-semibold">
                                          현재: {project.currentAmount.toLocaleString()}원
                                        </span>
                                        <span className="text-muted-foreground">
                                          {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        project.status === "OPEN"
                                          ? "default"
                                          : project.status === "SUCCESS"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {project.status === "OPEN"
                                        ? "진행 중"
                                        : project.status === "SUCCESS"
                                        ? "성공"
                                        : project.status === "FAILED"
                                        ? "실패"
                                        : project.status === "CANCELED"
                                        ? "취소됨"
                                        : "초안"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Link>
                            <div className="flex flex-col gap-2">
                              {canEditProject(project, user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    router.push(`/project/${project.id}/edit`)
                                  }}
                                >
                                  <Edit className="size-4" />
                                </Button>
                              )}
                              {canCancelProject(project, user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelProject}
                                >
                                  <X className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>

            {/* 내 경매 */}
            <TabsContent value="auctions" className="mt-6">
              <div className="space-y-4">
                {myAuctions.length === 0 ? (
                  <EmptyState
                    icon={Gavel}
                    title="등록한 경매가 없습니다"
                    action={{
                      label: "경매 등록하기",
                      href: "/auction/create",
                    }}
                  />
                ) : (
                  myAuctions.map((auction) => {
                    const handleCancelAuction = async () => {
                      if (!confirm("정말로 이 경매를 취소하시겠습니까? 취소된 경매는 복구할 수 없습니다.")) {
                        return
                      }

                      try {
                        await auctionApi.updateAuction(auction.id, {
                          status: "CANCELED" as const,
                        })
                        toast.success("경매가 취소되었습니다")
                        // 경매 목록 새로고침
                        const allAuctions = await auctionApi.getAuctions()
                        const myAuctionsList = allAuctions.filter(a => a.seller.id === user?.id)
                        setMyAuctions(myAuctionsList)
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "경매 취소에 실패했습니다")
                      }
                    }

                    return (
                      <Card key={auction.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <Link href={`/auction/${auction.id}`} className="flex-1">
                              <div className="flex gap-4">
                                <div className="relative size-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={auction.imageUrl || "/placeholder.svg"}
                                    alt={auction.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-lg mb-1 truncate">{auction.title}</h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {auction.description}
                                      </p>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="text-muted-foreground">
                                          시작가: {auction.startPrice.toLocaleString()}원
                                        </span>
                                        <span className="text-primary font-semibold">
                                          현재가: {auction.currentPrice.toLocaleString()}원
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        auction.status === "RUNNING"
                                          ? "default"
                                          : auction.status === "ENDED"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {auction.status === "SCHEDULED"
                                        ? "예정"
                                        : auction.status === "RUNNING"
                                        ? "진행 중"
                                        : auction.status === "ENDED"
                                        ? "종료"
                                        : "취소됨"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Link>
                            <div className="flex flex-col gap-2">
                              {canEditAuction(auction, user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    router.push(`/auction/${auction.id}/edit`)
                                  }}
                                >
                                  <Edit className="size-4" />
                                </Button>
                              )}
                              {canCancelAuction(auction, user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelAuction}
                                >
                                  <X className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>

            {/* 후원 내역 */}
            <TabsContent value="supports" className="mt-6">
              <div className="space-y-4">
                {mySupports.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title="후원 내역이 없습니다"
                  />
                ) : (
                  mySupports.map((support) => (
                    <Card key={support.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{support.projectTitle}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              리워드: {support.rewardTierTitle}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="size-4" />
                              <span>
                                {new Date(support.createdAt).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-primary">
                              {support.amount.toLocaleString()}원
                            </p>
                            <Link href={`/project/${support.projectId}`}>
                              <Button variant="link" size="sm" className="mt-2">
                                프로젝트 보기
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 찜한 항목 */}
            <TabsContent value="favorites" className="mt-6">
              <div className="space-y-6">
                {/* 찜한 프로젝트 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Heart className="size-5" />
                    찜한 프로젝트 ({favoriteProjects.length})
                  </h3>
                  {favoriteProjects.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="찜한 프로젝트가 없습니다"
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {favoriteProjects.map((project) => {
                        const endTime = new Date(project.endAt)
                        const now = new Date()
                        const daysLeft = isNaN(endTime.getTime())
                          ? 0
                          : Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        const backers = project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
                        
                        return (
                          <Link key={project.id} href={`/project/${project.id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <div className="relative aspect-video overflow-hidden bg-muted">
                                <Image
                                  src={project.imageUrl || "/placeholder.svg"}
                                  alt={project.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <CardContent className="pt-4">
                                <h4 className="font-semibold mb-2 line-clamp-2">{project.title}</h4>
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-lg font-bold text-primary">
                                    {project.currentAmount.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-muted-foreground">원</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>{backers}명 참여</span>
                                  <span>{daysLeft > 0 ? `${daysLeft}일 남음` : "종료"}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 찜한 경매 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <Heart className="size-5" />
                    찜한 경매 ({favoriteAuctions.length})
                  </h3>
                  {favoriteAuctions.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="찜한 경매가 없습니다"
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {favoriteAuctions.map((auction) => {
                        const endTime = new Date(auction.endAt)
                        const now = new Date()
                        const distance = isNaN(endTime.getTime()) ? 0 : endTime.getTime() - now.getTime()
                        let timeLeft = "종료됨"
                        if (distance > 0) {
                          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
                          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                          if (days > 0) {
                            timeLeft = `${days}일 ${hours}시간`
                          } else if (hours > 0) {
                            timeLeft = `${hours}시간`
                          } else {
                            timeLeft = "곧 종료"
                          }
                        }
                        
                        return (
                          <Link key={auction.id} href={`/auction/${auction.id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <div className="relative aspect-video overflow-hidden bg-muted">
                                <Image
                                  src={auction.imageUrl || "/placeholder.svg"}
                                  alt={auction.title}
                                  fill
                                  className="object-cover"
                                />
                                {auction.status === "RUNNING" && (
                                  <Badge className="absolute right-3 top-3 animate-pulse bg-destructive">
                                    LIVE
                                  </Badge>
                                )}
                              </div>
                              <CardContent className="pt-4">
                                <h4 className="font-semibold mb-2 line-clamp-2">{auction.title}</h4>
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-lg font-bold text-secondary">
                                    {auction.currentPrice.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-muted-foreground">원</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {timeLeft}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 입찰 내역 */}
            <TabsContent value="bids" className="mt-6">
              <div className="space-y-4">
                {myBids.length === 0 ? (
                  <EmptyState
                    icon={Gavel}
                    title="입찰 내역이 없습니다"
                  />
                ) : (
                  myBids.map((bid) => (
                    <Card key={bid.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{bid.auctionTitle}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Calendar className="size-4" />
                              <span>
                                {new Date(bid.createdAt).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-primary">
                              {bid.amount.toLocaleString()}원
                            </p>
                            <Link href={`/auction/${bid.auctionId}`}>
                              <Button variant="link" size="sm" className="mt-2">
                                경매 보기
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function ProfileContentWrapper() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") === "favorites" ? "favorites" : "projects"
  return <ProfileTabs defaultTab={activeTab} />
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
      </div>
    }>
      <ProfileContentWrapper />
    </Suspense>
  )
}
