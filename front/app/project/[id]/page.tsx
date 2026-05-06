"use client"

import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Progress } from "@/src/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Calendar, Clock, Heart, Share2, TrendingUp, MapPin, CheckCircle2, Loader2, AlertCircle, Edit, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, use, useDeferredValue } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { projectApi, addressApi, adminApi } from "@/src/services/api"
import { ProjectResponse, AddressResponse, AddressCreateRequest, UserResponse } from "@/src/types/api"
import { RewardCard } from "@/src/components/reward-card"
import { toast } from "sonner"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { isInWishlist, toggleWishlist } from "@/src/lib/wishlist"
import { canEditProject, canCancelProject, canSupportProject, isProjectCreator, isAdmin } from "@/src/lib/permissions"
import type { ProjectStatus } from "@/src/types/api"
import { useDaumPostcodePopup } from "react-daum-postcode"

/** 프로젝트 상태 한글 라벨 */
const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "오픈 전",
  OPEN: "열림",
  SUCCESS: "펀딩 성공",
  FAILED: "실패",
  CANCELED: "취소됨",
  REJECTED: "관리자 거절",
  STOP: "일시정지",
}

/** 비공개 상태: 작성자/어드민만 접근 가능 */
function canViewProject(project: ProjectResponse, user: UserResponse | null): boolean {
  if (!project) return false
  if (project.status === "DRAFT" || project.status === "REJECTED" || project.status === "STOP") {
    return isProjectCreator(project, user) || isAdmin(user)
  }
  return true
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const shouldForceError = searchParams.get("forceError") === "1"
  if (process.env.NODE_ENV !== "production" && shouldForceError) {
    throw new Error("의도적 에러 테스트: 프로젝트 상세 페이지")
  }

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supportDialogOpen, setSupportDialogOpen] = useState(false)
  const [selectedRewardTier, setSelectedRewardTier] = useState<number | null>(null)
  const [supportQuantity, setSupportQuantity] = useState<string>("")
  const deferredQuantity = useDeferredValue(supportQuantity) // 빠른 입력 시 렉 방지
  const [isSupporting, setIsSupporting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<AddressCreateRequest>({
    recipientName: "",
    phone: "",
    zipCode: "",
    address: "",
    detailAddress: "",
    setAsDefault: false,
  })
  const [adminActionDialog, setAdminActionDialog] = useState<"reject" | "force-stop" | "force-cancel" | null>(null)
  const [adminActionReason, setAdminActionReason] = useState("")
  const openPostcodePopup = useDaumPostcodePopup()

  const fillAddressFromUserInfo = () => {
    if (!user) {
      toast.error("로그인 사용자 정보를 찾을 수 없습니다")
      return
    }

    const userName = user.name?.trim() || ""
    const userPhone = user.phone?.trim() || ""

    if (!userName && !userPhone) {
      toast.info("프로필에 이름/전화번호가 없어 자동 입력할 수 없습니다")
      return
    }

    setNewAddress((prev) => ({
      ...prev,
      recipientName: userName || prev.recipientName,
      phone: userPhone || prev.phone,
    }))

    if (!userName || !userPhone) {
      toast.info("프로필 정보가 일부만 있어 입력 가능한 항목만 반영했습니다")
      return
    }

    toast.success("수령인 이름과 전화번호를 자동 입력했습니다")
  }

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const projectId = parseInt(id, 10)
        if (isNaN(projectId)) {
          throw new Error("유효하지 않은 프로젝트 ID입니다")
        }
        await projectApi.checkAndUpdateProjectStatus(projectId)
        const data = await projectApi.getProject(projectId)
        setProject(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로젝트 정보를 불러오는 중 오류가 발생했습니다")
        toast.error("프로젝트 정보를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id])

  // 배송지 목록 로드 (다이얼로그 열 때)
  useEffect(() => {
    if (supportDialogOpen && isAuthenticated) {
      loadAddresses()
    }
  }, [supportDialogOpen, isAuthenticated])

  const loadAddresses = async () => {
    try {
      const addressList = await addressApi.getMyAddresses()
      setAddresses(addressList)
      // 기본 배송지 자동 선택
      const defaultAddr = addressList.find(addr => addr.isDefault)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
      } else if (addressList.length > 0) {
        setSelectedAddressId(addressList[0].id)
      }
    } catch {
      // 에러가 발생해도 구매는 가능하도록 함
    }
  }

  // 프로젝트 상태 주기적 체크 (30초마다)
  useEffect(() => {
    if (!project) return

    const checkStatus = async () => {
      const projectId = parseInt(id, 10)
      if (isNaN(projectId)) return

      const updatedProject = await projectApi.checkAndUpdateProjectStatus(projectId)
      if (updatedProject && updatedProject.status !== project.status) {
        // 상태가 변경되었으면 프로젝트 정보 새로고침
        setProject(updatedProject)

        // 상태 변경 알림
        if (updatedProject.status === 'SUCCESS') {
          toast.success("프로젝트가 성공적으로 완료되었습니다!")
        } else if (updatedProject.status === 'FAILED') {
          toast.info("프로젝트가 실패했습니다")
        } else if (updatedProject.status === 'OPEN') {
          toast.info("프로젝트가 시작되었습니다")
        }
      }
    }

    // 즉시 한 번 체크
    checkStatus()

    // 30초마다 체크
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [id, project])

  // 찜하기 상태 동기화
  useEffect(() => {
    if (project) {
      setIsFavorite(isInWishlist(project.id, "project"))
    }
  }, [project])

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = async () => {
    if (!project) return

    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 복구할 수 없습니다.")) {
      return
    }

    try {
      await projectApi.deleteProject(project.id)
      toast.success("프로젝트가 삭제되었습니다")
      router.push("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "프로젝트 삭제에 실패했습니다")
    }
  }

  // 후원하기 핸들러 (PledgeCreateRequestDto: items, donateAmount)
  const handleSupport = async () => {
    if (!project) return

    const now = new Date()
    const projectStartAt = new Date(project.startAt)
    if (!isNaN(projectStartAt.getTime()) && now < projectStartAt) {
      toast.error("아직 시작 전인 프로젝트입니다. 시작일 이후에 구매할 수 있습니다.")
      return
    }

    // 권한 체크
    if (!canSupportProject(project, user)) {
      if (isProjectCreator(project, user)) {
        toast.error("자신의 프로젝트에는 후원할 수 없습니다")
      } else {
        toast.error("후원할 수 없는 프로젝트입니다")
      }
      return
    }

    // 리워드 티어 선택 필수
    let rewardTierId = selectedRewardTier
    if (rewardTierId === null || rewardTierId === undefined) {
      if (project.rewardTiers.length > 0) {
        rewardTierId = project.rewardTiers[0].id ?? project.rewardTiers[0].rewardTierId
      } else {
        toast.error("리워드 티어가 없습니다")
        return
      }
    }

    const selectedTier = project.rewardTiers.find(
      (t) => t.id === rewardTierId || t.rewardTierId === rewardTierId
    )
    if (!selectedTier) {
      toast.error("유효하지 않은 리워드 티어입니다")
      return
    }

    const quantity = Math.max(1, parseInt(supportQuantity, 10) || 0)
    if (quantity < 1) {
      toast.error("수량을 입력해주세요 (1개 이상)")
      return
    }
    if (selectedTier.limitQuantity != null && quantity > selectedTier.limitQuantity - selectedTier.soldQuantity) {
      toast.error(`남은 수량(${selectedTier.limitQuantity - selectedTier.soldQuantity}개)을 초과할 수 없습니다`)
      return
    }

    const tierId = selectedTier.rewardTierId ?? selectedTier.id

    try {
      setIsSupporting(true)
      await projectApi.createPledge(project.id, {
        items: [{ rewardTierId: tierId, quantity }],
      })

      toast.success("리워드 구매가 완료되었습니다!")
      setSupportDialogOpen(false)
      setSupportQuantity("")
      setSelectedRewardTier(null)
      setSelectedAddressId(null)
      setShowAddressForm(false)

      // 프로젝트 정보 업데이트
      const updatedProject = await projectApi.getProject(project.id)
      setProject(updatedProject)

      // 사용자 포인트 정보 업데이트 (네비게이션 바의 포인트 잔액 즉시 반영)
      await refreshUser()

      if (updatedProject.status === "SUCCESS" && project.status === "OPEN") {
        toast.success("축하합니다! 프로젝트가 목표 금액을 달성했습니다!")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "리워드 구매에 실패했습니다"
      toast.error(errorMessage)
    } finally {
      setIsSupporting(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-muted-foreground">프로젝트 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    )
  }

  // 에러 상태
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error || "프로젝트 정보를 찾을 수 없습니다"}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // 날짜 파싱을 try-catch로 감싸서 에러 처리
  let progress: number
  let startTime: Date
  let endTime: Date
  let daysLeft: number
  
  try {
    progress = (project.currentAmount / project.targetAmount) * 100
    
    // 날짜 파싱 (안전하게)
    // 먼저 날짜 문자열 유효성 검사
    if (!project.startAt || !project.endAt || typeof project.startAt !== 'string' || typeof project.endAt !== 'string') {
      throw new Error("프로젝트 날짜 정보가 없습니다")
    }
    startTime = new Date(project.startAt)
    endTime = new Date(project.endAt)
    const now = new Date()
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("프로젝트 날짜 정보가 유효하지 않습니다")
    }
    daysLeft = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } catch (err) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {err instanceof Error ? err.message : "프로젝트 날짜 정보 처리 중 오류가 발생했습니다"}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  const isFundingStarted = new Date() >= startTime

  // DRAFT/REJECTED/STOP: 작성자·어드민이 아니면 비공개 화면
  if (!canViewProject(project, user)) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>접근할 수 없습니다</CardTitle>
              <CardDescription>
                {project.status === "DRAFT" && "이 프로젝트는 아직 공개되지 않았습니다."}
                {project.status === "REJECTED" && "관리자에 의해 거절된 프로젝트입니다."}
                {project.status === "STOP" && "관리자에 의해 일시정지된 프로젝트입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push("/projects")}>
                프로젝트 목록으로
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero image gallery */}
            {(() => {
              const images = project.imageUrls && project.imageUrls.length > 0 
                ? project.imageUrls 
                : project.imageUrl 
                  ? [project.imageUrl] 
                  : ["/placeholder.svg"]
              const currentSrc = images[selectedImageIndex] || "/placeholder.svg"
              const isExternalUrl = currentSrc.startsWith("http://") || currentSrc.startsWith("https://")
              const hasMultipleImages = images.length > 1

              return (
                <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={currentSrc}
                    alt={project.title}
                    fill
                    className="object-contain p-1"
                    unoptimized={isExternalUrl}
                  />
                  
                  {/* 이미지 네비게이션 버튼 */}
                  {hasMultipleImages && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      
                      {/* 이미지 인디케이터 */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`h-2 rounded-full transition-all ${
                              index === selectedImageIndex
                                ? "w-8 bg-primary"
                                : "w-2 bg-background/50 hover:bg-background/80"
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                            aria-label={`이미지 ${index + 1}로 이동`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  <Badge className="absolute left-4 top-4">크라우드펀딩</Badge>
                  <Badge
                    variant={
                      project.status === "OPEN" || project.status === "SUCCESS"
                        ? "default"
                        : project.status === "FAILED" || project.status === "REJECTED" || project.status === "CANCELED"
                        ? "destructive"
                        : "secondary"
                    }
                    className={`absolute right-4 top-4 ${
                      project.status === "SUCCESS" ? "bg-green-500" : ""
                    } ${project.status === "STOP" ? "bg-amber-500" : ""}`}
                  >
                    {STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                </div>
              )
            })()}

            {/* 상태별 배너 (DRAFT/REJECTED/STOP) */}
            {project.status === "DRAFT" && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>미리보기</strong> — 아직 오픈 전입니다. 관리자가 승인하면 프로젝트가 시작됩니다.
                </AlertDescription>
              </Alert>
            )}
            {project.status === "REJECTED" && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>관리자에 의해 거절</strong>되었습니다. 자세한 사항은 문의해주세요.
                </AlertDescription>
              </Alert>
            )}
            {project.status === "STOP" && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>일시정지</strong> — 관리자에 의해 일시정지된 프로젝트입니다.
                </AlertDescription>
              </Alert>
            )}
            {project.status === "SUCCESS" && (
              <Alert className="mb-4 border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-600" />
                <AlertDescription>
                  <strong>펀딩 성공!</strong> 목표 금액을 달성했습니다.
                </AlertDescription>
              </Alert>
            )}
            {project.status === "FAILED" && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>펀딩 실패</strong> — 목표 금액을 달성하지 못했습니다.
                </AlertDescription>
              </Alert>
            )}
            {project.status === "CANCELED" && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>취소됨</strong> — 작성자에 의해 취소된 프로젝트입니다.
                </AlertDescription>
              </Alert>
            )}

            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="mb-3 text-balance text-3xl font-bold leading-tight md:text-4xl">{project.title}</h1>
              <p className="mb-4 text-pretty text-lg text-muted-foreground">{project.description}</p>

              <div className="flex flex-wrap gap-3">
                {project.status !== "DRAFT" && (
                  <>
                    {isAuthenticated && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0 rounded-full"
                        onClick={() => {
                          if (!project) return
                          toggleWishlist(project.id, "project")
                          const nowInWishlist = isInWishlist(project.id, "project")
                          setIsFavorite(nowInWishlist)
                          if (nowInWishlist) {
                            toast.success("찜하기에 추가되었습니다")
                          } else {
                            toast.info("찜하기에서 제거되었습니다")
                          }
                        }}
                      >
                        <Heart
                          className={`size-5 transition-colors ${
                            isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 size-4" />
                      공유하기
                    </Button>
                  </>
                )}
                {/* 작성자 전용 버튼 - 자기가 생성한 프로젝트면 수정 버튼 표시 */}
                {isProjectCreator(project, user) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      router.push(`/project/${project.id}/edit`)
                    }}
                  >
                    <Edit className="mr-2 size-4" />
                    수정하기
                  </Button>
                )}
                {canCancelProject(project, user) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeleteProject}
                  >
                    <X className="mr-2 size-4" />
                    삭제하기
                  </Button>
                )}
              </div>
            </div>

            {/* Creator info */}
            {project.creator && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="size-12">
                      <AvatarImage
                        src={project.creator.profileImageUrl || "/placeholder.svg"}
                        alt={project.creator.nickname || "작성자"}
                      />
                      <AvatarFallback>{(project.creator.nickname || "작성자")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.creator.nickname || "알 수 없음"}</CardTitle>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {project.creator.email || "이메일 없음"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="story">프로젝트 스토리</TabsTrigger>
                <TabsTrigger value="rewards">리워드</TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="mt-6">
                <Card>
                  <CardContent className="prose prose-sm max-w-none pt-6 dark:prose-invert">
                    <div className="whitespace-pre-line leading-relaxed">{project.description}</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="mt-6">
                <div className="space-y-4">
                  {project.rewardTiers.map((reward) => {
                    const tierId = reward.rewardTierId ?? reward.id
                    return (
                      <RewardCard
                        key={tierId}
                        id={String(tierId)}
                        title={reward.title}
                        amount={reward.price}
                        description={reward.description}
                        items={[]}
                        estimatedDelivery="예정일 미정"
                        limited={reward.limitQuantity || undefined}
                        remaining={
                          reward.limitQuantity
                            ? reward.limitQuantity - reward.soldQuantity
                            : undefined
                        }
                        backers={reward.soldQuantity}
                        featured={false}
                        selectable={project.status === "OPEN"}
                        onSelect={() => {
                          if (!isAuthenticated) {
                            toast.error("로그인이 필요합니다")
                            return
                          }
                          if (isProjectCreator(project, user)) {
                            toast.error("자신의 프로젝트에는 후원할 수 없습니다")
                            return
                          }
                          if (project.status !== "OPEN") {
                            toast.error("후원할 수 없는 프로젝트입니다")
                            return
                          }
                          if (reward.soldOut) {
                            toast.error("품절된 리워드입니다")
                            return
                          }
                          setSelectedRewardTier(tierId)
                          setSupportQuantity("")
                          setSupportDialogOpen(true)
                        }}
                      />
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Funding stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {project.currentAmount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">원</span>
                    </div>
                    <div className="mb-2 text-sm text-muted-foreground">
                      목표 금액: {project.targetAmount.toLocaleString()}원
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="mt-2 text-right text-sm font-medium">{progress.toFixed(0)}% 달성</div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-4" />
                        <span className="text-xs">리워드 구매수</span>
                      </div>
                      <p className="text-xl font-bold">
                        {project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0).toLocaleString()}건
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4" />
                        <span className="text-xs">남은 시간</span>
                      </div>
                      <p className="text-xl font-bold">{timeLeft || (daysLeft > 0 ? `${daysLeft}일` : "종료")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project info */}
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">프로젝트 시작</span>
                    <span className="font-semibold">
                      {isNaN(startTime.getTime()) 
                        ? "날짜 오류" 
                        : startTime.toLocaleDateString("ko-KR", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric" 
                          })
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">프로젝트 종료</span>
                    <span className="font-semibold">
                      {isNaN(endTime.getTime()) 
                        ? "날짜 오류" 
                        : endTime.toLocaleDateString("ko-KR", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric" 
                          })
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">상태</span>
                    <Badge
                      variant={
                        project.status === "OPEN" || project.status === "SUCCESS"
                          ? "default"
                          : project.status === "FAILED" || project.status === "REJECTED" || project.status === "CANCELED"
                          ? "destructive"
                          : "secondary"
                      }
                      className={project.status === "SUCCESS" ? "bg-green-500" : project.status === "STOP" ? "bg-amber-500" : ""}
                    >
                      {STATUS_LABELS[project.status] ?? project.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 어드민 전용: 크라우드펀딩 관리 (AdminController 기준) */}
              {isAdmin(user) && (
                <div className="space-y-2">
                  {project.status === "DRAFT" && (
                    <>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={async () => {
                          try {
                            await adminApi.approveProject(project.id)
                            toast.success("펀딩이 오픈되었습니다!")
                            const updated = await projectApi.getProject(project.id)
                            setProject(updated)
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "펀딩 오픈에 실패했습니다")
                          }
                        }}
                      >
                        펀딩 오픈 승인
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          setAdminActionReason("")
                          setAdminActionDialog("reject")
                        }}
                      >
                        프로젝트 거절
                      </Button>
                    </>
                  )}
                  {project.status === "OPEN" && (
                    <>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={() => {
                          setAdminActionReason("")
                          setAdminActionDialog("force-stop")
                        }}
                      >
                        강제 정지
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          setAdminActionReason("")
                          setAdminActionDialog("force-cancel")
                        }}
                      >
                        강제 취소 (환불)
                      </Button>
                    </>
                  )}
                  {project.status === "STOP" && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await adminApi.approveProject(project.id)
                          toast.success("펀딩이 재개되었습니다!")
                          const updated = await projectApi.getProject(project.id)
                          setProject(updated)
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "펀딩 재개에 실패했습니다")
                        }
                      }}
                    >
                      펀딩 재개
                    </Button>
                  )}
                </div>
              )}

              {/* 어드민 전용 다이얼로그: 거절/강제정지/강제취소 사유 입력 */}
              {adminActionDialog && (
                <Dialog
                  open={!!adminActionDialog}
                  onOpenChange={(open) => {
                    if (!open) {
                      setAdminActionDialog(null)
                      setAdminActionReason("")
                    }
                  }}
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {adminActionDialog === "reject" && "프로젝트 거절"}
                        {adminActionDialog === "force-stop" && "프로젝트 강제 정지"}
                        {adminActionDialog === "force-cancel" && "프로젝트 강제 취소"}
                      </DialogTitle>
                      <DialogDescription>
                        {adminActionDialog === "reject" && "거절 사유를 입력해주세요."}
                        {adminActionDialog === "force-stop" && "정지 사유를 입력해주세요."}
                        {adminActionDialog === "force-cancel" && "취소 사유를 입력해주세요. (환불이 진행됩니다)"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-reason">사유 *</Label>
                        <textarea
                          id="admin-reason"
                          value={adminActionReason}
                          onChange={(e) => setAdminActionReason(e.target.value)}
                          placeholder="사유를 입력해주세요"
                          rows={4}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setAdminActionDialog(null)
                            setAdminActionReason("")
                          }}
                        >
                          취소
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          disabled={!adminActionReason.trim()}
                          onClick={async () => {
                            if (!adminActionReason.trim()) return
                            try {
                              if (adminActionDialog === "reject") {
                                await adminApi.rejectProject(project.id, adminActionReason.trim())
                                toast.success("프로젝트가 거절되었습니다")
                              } else if (adminActionDialog === "force-stop") {
                                await adminApi.forceStopProject(project.id, adminActionReason.trim())
                                toast.success("프로젝트가 정지되었습니다")
                              } else if (adminActionDialog === "force-cancel") {
                                await adminApi.forceCancelProject(project.id, adminActionReason.trim())
                                toast.success("프로젝트가 취소되었습니다 (환불 진행)")
                              }
                              setAdminActionDialog(null)
                              setAdminActionReason("")
                              const updated = await projectApi.getProject(project.id)
                              setProject(updated)
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다")
                            }
                          }}
                        >
                          확인
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* 자기 프로젝트일 때 버튼들 */}
              {isProjectCreator(project, user) && (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/project/${project.id}/edit`)}
                  >
                    <Edit className="mr-2 size-4" />
                    프로젝트 수정
                  </Button>
                  {canCancelProject(project, user) && (
                    <Button
                      size="lg"
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        if (confirm("프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 복구할 수 없습니다.")) {
                          try {
                            await projectApi.deleteProject(project.id)
                            toast.success("프로젝트가 삭제되었습니다")
                            router.push("/")
                          } catch (error) {
                            toast.error("프로젝트 삭제에 실패했습니다")
                          }
                        }
                      }}
                    >
                      <X className="mr-2 size-4" />
                      프로젝트 삭제
                    </Button>
                  )}
                </div>
              )}

              {/* 리워드 구매 버튼 */}
              {project.status === "OPEN" && !isProjectCreator(project, user) && (
                <Dialog 
                  open={supportDialogOpen} 
                  onOpenChange={(open) => {
                    setSupportDialogOpen(open)
                    // 다이얼로그가 닫힐 때 상태 초기화
                    if (!open) {
                      setSelectedRewardTier(null)
                      setSupportQuantity("")
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full" disabled={!isAuthenticated || !isFundingStarted}>
                      {!isAuthenticated
                        ? "로그인 후 이용해주세요"
                        : !isFundingStarted
                          ? "시작일 이후 구매 가능"
                          : "리워드 구매하기"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>리워드 구매하기</DialogTitle>
                      <DialogDescription>
                        리워드 티어를 선택하고 배송지를 선택해주세요
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* 리워드 티어 선택 */}
                      <div className="space-y-2">
                        <Label>리워드 티어 선택 *</Label>
                        <div className="space-y-2">
                          {project.rewardTiers.map((tier) => {
                            const tierId = tier.rewardTierId ?? tier.id
                            return (
                            <button
                              key={tierId}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedRewardTier(tierId)
                                setSupportQuantity("")
                              }}
                              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                                selectedRewardTier === tierId
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-accent"
                              } ${tier.soldOut ? "opacity-60 cursor-not-allowed" : ""}`}
                              disabled={tier.soldOut}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{tier.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {tier.price.toLocaleString()}원
                                    {tier.soldOut && " (품절)"}
                                  </div>
                                </div>
                                {selectedRewardTier === tierId && (
                                  <CheckCircle2 className="size-5 text-primary" />
                                )}
                              </div>
                            </button>
                          )})}
                        </div>
                      </div>

                      {/* 수량 입력 */}
                      {selectedRewardTier && (
                        <div className="space-y-2">
                          <Label htmlFor="supportQuantity">수량 *</Label>
                          <Input
                            id="supportQuantity"
                            type="text"
                            inputMode="numeric"
                            placeholder="수량 입력"
                            value={supportQuantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "")
                              setSupportQuantity(val)
                            }}
                          />
                          {selectedRewardTier && (() => {
                            const tier = project.rewardTiers.find(t => (t.rewardTierId ?? t.id) === selectedRewardTier)
                            const limitRemaining = tier?.limitQuantity ? tier.limitQuantity - tier.soldQuantity : null
                            const qty = parseInt(deferredQuantity, 10) || 0
                            const totalAmount = tier ? tier.price * qty : 0
                            return (
                              <div className="space-y-0.5">
                                <p className="text-xs text-muted-foreground">총 금액: {totalAmount.toLocaleString()}원</p>
                                {limitRemaining != null && (
                                  <p className="text-xs text-muted-foreground">남은 수량: {limitRemaining}개</p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* 배송지 선택 */}
                      {!showAddressForm ? (
                        <div className="space-y-2">
                          <Label>배송지 선택 *</Label>
                          {addresses.length > 0 ? (
                            <select
                              value={selectedAddressId || ""}
                              onChange={(e) => setSelectedAddressId(parseInt(e.target.value, 10))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">배송지를 선택해주세요</option>
                              {addresses.map((address) => (
                                <option key={address.id} value={address.id}>
                                  {address.recipientName} {address.isDefault ? "(기본)" : ""} - {address.address}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Alert>
                              <AlertDescription>
                                등록된 배송지가 없습니다. 배송지를 추가해주세요.
                              </AlertDescription>
                            </Alert>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddressForm(true)}
                            className="w-full"
                          >
                            <MapPin className="mr-2 size-4" />
                            새 배송지 추가
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">배송지 정보</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={fillAddressFromUserInfo}>
                                사용자 정보와 동일
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowAddressForm(false)
                                  setNewAddress({
                                    recipientName: "",
                                    phone: "",
                                    zipCode: "",
                                    address: "",
                                    detailAddress: "",
                                    setAsDefault: false,
                                  })
                                }}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="recipientName">수령인 이름 *</Label>
                            <Input
                              id="recipientName"
                              value={newAddress.recipientName}
                              onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                              placeholder="홍길동"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">전화번호 *</Label>
                            <Input
                              id="phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              placeholder="010-1234-5678"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">우편번호 *</Label>
                            <div className="flex gap-2">
                              <Input
                                id="zipCode"
                                value={newAddress.zipCode}
                                onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                placeholder="12345"
                                readOnly
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  openPostcodePopup({
                                    onComplete: (data) => {
                                      let fullAddress = data.address
                                      if (data.addressType === "R") {
                                        let extra = ""
                                        if (data.bname) extra += data.bname
                                        if (data.buildingName) extra += (extra ? `, ${data.buildingName}` : data.buildingName)
                                        if (extra) fullAddress += ` (${extra})`
                                      }
                                      setNewAddress((prev) => ({
                                        ...prev,
                                        zipCode: data.zonecode,
                                        address: fullAddress,
                                      }))
                                    },
                                  })
                                }}
                              >
                                주소 검색
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">주소 *</Label>
                            <Input
                              id="address"
                              value={newAddress.address}
                              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                              placeholder="주소 검색을 클릭하세요"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="detailAddress">상세주소 *</Label>
                            <Input
                              id="detailAddress"
                              value={newAddress.detailAddress}
                              onChange={(e) => setNewAddress({ ...newAddress, detailAddress: e.target.value })}
                              placeholder="101동 101호"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="setAsDefault"
                              checked={newAddress.setAsDefault}
                              onChange={(e) => setNewAddress({ ...newAddress, setAsDefault: e.target.checked })}
                              className="rounded border-border"
                            />
                            <Label htmlFor="setAsDefault" className="cursor-pointer">
                              기본 배송지로 설정
                            </Label>
                          </div>
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!newAddress.recipientName || !newAddress.phone || !newAddress.zipCode || !newAddress.address || !newAddress.detailAddress) {
                                toast.error("모든 필드를 입력해주세요")
                                return
                              }
                              try {
                                const addressId = await addressApi.createAddress(newAddress)
                                toast.success("배송지가 추가되었습니다")
                                await loadAddresses()
                                setSelectedAddressId(addressId)
                                setShowAddressForm(false)
                                setNewAddress({
                                  recipientName: "",
                                  phone: "",
                                  zipCode: "",
                                  address: "",
                                  detailAddress: "",
                                  setAsDefault: false,
                                })
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "배송지 추가에 실패했습니다")
                              }
                            }}
                            className="w-full"
                          >
                            배송지 추가하기
                          </Button>
                        </div>
                      )}

                      {/* 구매 버튼 (백엔드 Pledge API는 배송지 미포함, 추후 확장 가능) */}
                      <Button
                        onClick={handleSupport}
                        disabled={!selectedRewardTier || !deferredQuantity || parseInt(deferredQuantity, 10) < 1 || isSupporting || project.rewardTiers.length === 0}
                        className="w-full"
                      >
                        {isSupporting ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            구매 중...
                          </>
                        ) : (
                          "리워드 구매하기"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
