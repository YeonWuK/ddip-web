"use client"

import { Navigation } from "@/src/components/navigation"
import { EmptyState } from "@/src/components/empty-state"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { useForm } from "react-hook-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Separator } from "@/src/components/ui/separator"
import { Loader2, Calendar, TrendingUp, Gavel, Heart, Package, Edit, X, MapPin, Plus, Trash2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { projectApi, auctionApi, userApi, addressApi } from "@/src/services/api"
import { ProjectResponse, AuctionResponse, AuctionSummary, SupportResponse, MyBidsSummary, UserPageResponse, AddressResponse, AddressCreateRequest, AddressUpdateRequest } from "@/src/types/api"
import { getWishlist } from "@/src/lib/wishlist"
import { canEditProject, canCancelProject, canEditAuction, canCancelAuction } from "@/src/lib/permissions"
import { formatBidDateTime } from "@/src/lib/date-utils"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

function ProfileTabs({ defaultTab }: { defaultTab: string }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [myProjects, setMyProjects] = useState<ProjectResponse[]>([])
  const [myAuctions, setMyAuctions] = useState<AuctionSummary[]>([])
  const [mySupports, setMySupports] = useState<SupportResponse[]>([])
  const [myBids, setMyBids] = useState<MyBidsSummary[]>([])
  const [favoriteProjects, setFavoriteProjects] = useState<ProjectResponse[]>([])
  const [favoriteAuctions, setFavoriteAuctions] = useState<AuctionSummary[]>([])
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [defaultAddress, setDefaultAddress] = useState<AddressResponse | null>(null)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadMyData()
    }
  }, [authLoading, isAuthenticated])

  // 배송지 목록은 별도로 로드 (항상 호출되도록)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAddresses()
    }
  }, [authLoading, isAuthenticated])

  const loadMyData = async () => {
    try {
      setLoading(true)
      
      // 마이페이지 데이터 조회
      const myPageData: UserPageResponse = await userApi.getMyPage()
      
      // 경매 목록 정보 사용 (AuctionSummary)
      const myAuctionsList: AuctionSummary[] = myPageData.auctions
      
      setMyAuctions(myAuctionsList)
      
      // 내 프로젝트는 별도로 조회 (백엔드에서 제공하지 않으면 필터링)
      const allProjects = await projectApi.getProjects()
      const userId = user?.id || myPageData.user.id
      const myProjectsList = allProjects.filter(p => p.creator.id === userId)
      setMyProjects(myProjectsList)
      
      // 후원 내역은 별도로 조회
      const supports = await projectApi.getMySupports(userId)
      setMySupports(supports)
      
      // 입찰 내역: my-page의 myMyBids 사용
      setMyBids(myPageData.myMyBids)
      
      // 찜한 항목 로드
      const wishlist = getWishlist()
      const favoriteProjectIds = wishlist
        .filter(item => item.type === "project")
        .map(item => item.id)
      const favoriteAuctionIds = wishlist
        .filter(item => item.type === "auction")
        .map(item => item.id)
      
      const favoriteProjectsList = allProjects.filter(p => favoriteProjectIds.includes(p.id))
      const allAuctions = await auctionApi.getAuctions()
      const favoriteAuctionsList = allAuctions.filter(a => favoriteAuctionIds.includes(a.id))
      
      setFavoriteProjects(favoriteProjectsList)
      setFavoriteAuctions(favoriteAuctionsList)
      
      // 배송지 목록은 별도 useEffect에서 로드하므로 여기서는 제거
    } catch (error) {
      toast.error("데이터를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const loadAddresses = async () => {
    try {
      const [addressList, defaultAddr] = await Promise.all([
        addressApi.getMyAddresses(),
        addressApi.getDefaultAddress().catch(() => null), // 204면 null 반환
      ])
      
      // 기본 배송지 ID와 비교하여 각 배송지의 isDefault 업데이트
      const updatedAddressList = addressList.map(addr => ({
        ...addr,
        isDefault: defaultAddr ? addr.id === defaultAddr.id : false,
      }))
      
      setAddresses(updatedAddressList)
      setDefaultAddress(defaultAddr)
    } catch (error) {
      // 에러가 발생해도 빈 배열로 설정하여 이전 상태가 남지 않도록 함
      setAddresses([])
      setDefaultAddress(null)
      // 에러 메시지는 사용자에게 표시하지 않음 (초기 로드 시에는 조용히 실패)
    }
  }

  const handleCreateAddress = async (data: AddressCreateRequest) => {
    try {
      await addressApi.createAddress(data)
      toast.success("배송지가 추가되었습니다")
      setAddressDialogOpen(false)
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "배송지 추가에 실패했습니다")
    }
  }

  const handleUpdateAddress = async (addressId: number, data: AddressUpdateRequest) => {
    try {
      await addressApi.updateAddress(addressId, data)
      toast.success("배송지가 수정되었습니다")
      setAddressDialogOpen(false)
      setEditingAddress(null)
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "배송지 수정에 실패했습니다")
    }
  }

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("정말로 이 배송지를 삭제하시겠습니까?")) {
      return
    }
    try {
      await addressApi.deleteAddress(addressId)
      toast.success("배송지가 삭제되었습니다")
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "배송지 삭제에 실패했습니다")
    }
  }

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      await addressApi.setDefaultAddress(addressId)
      toast.success("기본 배송지로 설정되었습니다")
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "기본 배송지 설정에 실패했습니다")
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="projects">내 프로젝트</TabsTrigger>
              <TabsTrigger value="auctions">내 경매</TabsTrigger>
              <TabsTrigger value="supports">후원 내역</TabsTrigger>
              <TabsTrigger value="bids">입찰 내역</TabsTrigger>
              <TabsTrigger value="favorites">찜한 항목</TabsTrigger>
              <TabsTrigger value="addresses">배송지 관리</TabsTrigger>
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
                        await projectApi.deleteProject(project.id)
                        toast.success("프로젝트가 삭제되었습니다")
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
                        await auctionApi.deleteAuction(auction.id)
                        toast.success("경매가 삭제되었습니다")
                        // 경매 목록 새로고침 (마이페이지 API 사용)
                        const myPageData = await userApi.getMyPage()
                        setMyAuctions(myPageData.auctions)
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
                                        {auction.summary || ""}
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
                              {/* 내 경매에서는 상태에 따라 수정/삭제 가능 */}
                              {auction.status === "SCHEDULED" && (
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
                              {(auction.status === "SCHEDULED" || auction.status === "RUNNING") && (
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
                    description="경매에 입찰한 내역이 여기에 표시됩니다"
                  />
                ) : (
                  myBids.map((bid) => (
                    <Card key={bid.auctionId}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          {bid.auctionThumbnailUrl && (
                            <Link href={`/auction/${bid.auctionId}`} className="shrink-0">
                              <div className="relative size-20 rounded-lg overflow-hidden bg-muted">
                                <Image
                                  src={bid.auctionThumbnailUrl}
                                  alt={bid.auctionTitle}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                            </Link>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold mb-1">{bid.auctionTitle}</h3>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    {formatBidDateTime(bid.lastBidAt)}
                                  </span>
                                  {bid.isHighestBidder && (
                                    <Badge variant="default" className="text-xs">최고 입찰가</Badge>
                                  )}
                                  {bid.auctionStatus === "ENDED" && (
                                    <Badge variant="secondary">종료</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm text-muted-foreground">내 입찰가</p>
                                <p className="text-lg font-semibold text-primary">
                                  {bid.lastBidPrice.toLocaleString()}원
                                </p>
                                {bid.currentPrice > bid.lastBidPrice && (
                                  <p className="text-xs text-destructive mt-0.5">
                                    현재가 {bid.currentPrice.toLocaleString()}원
                                  </p>
                                )}
                                <Link href={`/auction/${bid.auctionId}`}>
                                  <Button variant="link" size="sm" className="mt-2 px-0">
                                    경매 보기
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 배송지 관리 */}
            <TabsContent value="addresses" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">배송지 관리</h2>
                  <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingAddress(null)}>
                        <Plus className="mr-2 size-4" />
                        배송지 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? "배송지 수정" : "배송지 추가"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAddress ? "배송지 정보를 수정해주세요" : "새로운 배송지를 등록해주세요"}
                        </DialogDescription>
                      </DialogHeader>
                      <AddressForm
                        address={editingAddress}
                        onSubmit={editingAddress 
                          ? (data) => handleUpdateAddress(editingAddress.id, data as AddressUpdateRequest)
                          : (data) => handleCreateAddress(data as AddressCreateRequest)
                        }
                        onCancel={() => {
                          setAddressDialogOpen(false)
                          setEditingAddress(null)
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {addresses.length === 0 ? (
                  <EmptyState
                    icon={MapPin}
                    title="등록된 배송지가 없습니다"
                    description="배송지를 추가하면 리워드 구매 시 자동으로 사용됩니다"
                  />
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">수령인</p>
                                  <h3 className="font-semibold">{address.recipientName}</h3>
                                </div>
                                {address.isDefault && (
                                  <Badge variant="default">기본 배송지</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                                <p>{address.phone}</p>
                                <p>
                                  [{address.zipCode}] {address.address} {address.detailAddress}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!address.isDefault && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                >
                                  기본 배송지로 설정
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingAddress(address)
                                  setAddressDialogOpen(true)
                                }}
                              >
                                배송지 수정
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                배송지 삭제
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// 배송지 입력 폼 컴포넌트
function AddressForm({
  address,
  onSubmit,
  onCancel,
}: {
  address: AddressResponse | null
  onSubmit: (data: AddressCreateRequest | AddressUpdateRequest) => void
  onCancel: () => void
}) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AddressCreateRequest>({
    defaultValues: address ? {
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.address,
      detailAddress: address.detailAddress,
      setAsDefault: address.isDefault,
    } : {
      recipientName: "",
      phone: "",
      zipCode: "",
      address: "",
      detailAddress: "",
      setAsDefault: false,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientName">수령인 이름 *</Label>
        <Input
          id="recipientName"
          {...register("recipientName", { required: "수령인 이름을 입력해주세요" })}
          placeholder="홍길동"
        />
        {errors.recipientName && (
          <Alert variant="destructive">
            <AlertDescription>{errors.recipientName.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">전화번호 *</Label>
        <Input
          id="phone"
          {...register("phone", { 
            required: "전화번호를 입력해주세요",
            pattern: {
              value: /^[0-9-]+$/,
              message: "올바른 전화번호 형식이 아닙니다"
            }
          })}
          placeholder="010-1234-5678"
        />
        {errors.phone && (
          <Alert variant="destructive">
            <AlertDescription>{errors.phone.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">우편번호 *</Label>
        <Input
          id="zipCode"
          {...register("zipCode", { required: "우편번호를 입력해주세요" })}
          placeholder="12345"
        />
        {errors.zipCode && (
          <Alert variant="destructive">
            <AlertDescription>{errors.zipCode.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">주소 *</Label>
        <Input
          id="address"
          {...register("address", { required: "주소를 입력해주세요" })}
          placeholder="서울특별시 강남구 테헤란로 123"
        />
        {errors.address && (
          <Alert variant="destructive">
            <AlertDescription>{errors.address.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailAddress">상세주소 *</Label>
        <Input
          id="detailAddress"
          {...register("detailAddress", { required: "상세주소를 입력해주세요" })}
          placeholder="101동 101호"
        />
        {errors.detailAddress && (
          <Alert variant="destructive">
            <AlertDescription>{errors.detailAddress.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {!address && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="setAsDefault"
            {...register("setAsDefault")}
            className="rounded border-gray-300"
          />
          <Label htmlFor="setAsDefault" className="cursor-pointer">
            기본 배송지로 설정
          </Label>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {address ? "수정하기" : "추가하기"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
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
