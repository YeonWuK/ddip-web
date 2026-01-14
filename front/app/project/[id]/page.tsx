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
import { Calendar, Clock, Heart, Share2, TrendingUp, MapPin, CheckCircle2, Loader2, AlertCircle, Edit, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { projectApi } from "@/src/services/api"
import { ProjectResponse } from "@/src/types/api"
import { RewardCard } from "@/src/components/reward-card"
import { toast } from "sonner"
import { useAuth } from "@/src/contexts/auth-context"
import { ProtectedRoute } from "@/src/components/protected-route"
import { isInWishlist, toggleWishlist } from "@/src/lib/wishlist"
import { canEditProject, canCancelProject, canSupportProject, isProjectCreator } from "@/src/lib/permissions"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supportDialogOpen, setSupportDialogOpen] = useState(false)
  const [selectedRewardTier, setSelectedRewardTier] = useState<number | null>(null)
  const [supportAmount, setSupportAmount] = useState<string>("")
  const [isSupporting, setIsSupporting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

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
        console.log("프로젝트 로드 시작:", projectId)
        
        // 상태 체크 및 업데이트
        await projectApi.checkAndUpdateProjectStatus(projectId)
        
        const data = await projectApi.getProject(projectId)
        console.log("프로젝트 로드 성공:", {
          id: data.id,
          startAt: data.startAt,
          endAt: data.endAt,
          startAtType: typeof data.startAt,
          endAtType: typeof data.endAt
        })
        
        // 날짜 유효성 사전 검사
        if (data.startAt && typeof data.startAt === 'string') {
          const testStart = new Date(data.startAt)
          if (isNaN(testStart.getTime())) {
            console.error("로드된 프로젝트의 startAt이 유효하지 않음:", data.startAt)
          }
        }
        if (data.endAt && typeof data.endAt === 'string') {
          const testEnd = new Date(data.endAt)
          if (isNaN(testEnd.getTime())) {
            console.error("로드된 프로젝트의 endAt이 유효하지 않음:", data.endAt)
          }
        }
        
        setProject(data)
      } catch (err) {
        console.error("프로젝트 로드 에러:", err)
        setError(err instanceof Error ? err.message : "프로젝트 정보를 불러오는 중 오류가 발생했습니다")
        toast.error("프로젝트 정보를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id])

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

  // 프로젝트 취소 핸들러
  const handleCancelProject = async () => {
    if (!project) return
    
    if (!confirm("정말로 이 프로젝트를 취소하시겠습니까? 취소된 프로젝트는 복구할 수 없습니다.")) {
      return
    }

    try {
      await projectApi.updateProject(project.id, {
        status: "CANCELED" as const,
      })
      toast.success("프로젝트가 취소되었습니다")
      // 프로젝트 정보 새로고침
      const updatedProject = await projectApi.getProject(project.id)
      setProject(updatedProject)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "프로젝트 취소에 실패했습니다")
    }
  }

  // 후원하기 핸들러
  const handleSupport = async () => {
    if (!project || !supportAmount) {
      toast.error("후원 금액을 입력해주세요")
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

    const amount = parseInt(supportAmount.replace(/,/g, ""), 10)
    if (isNaN(amount) || amount < 1000) {
      toast.error("최소 1,000원 이상 후원해주세요")
      return
    }

    // 리워드 티어가 선택되지 않았으면 첫 번째 리워드 티어 사용
    let rewardTierId = selectedRewardTier
    if (rewardTierId === null || rewardTierId === undefined) {
      if (project.rewardTiers.length > 0) {
        rewardTierId = project.rewardTiers[0].id
      } else {
        toast.error("리워드 티어가 없습니다")
        return
      }
    }

    // rewardTierId가 유효한지 확인
    const selectedTier = project.rewardTiers.find(t => t.id === rewardTierId)
    if (!selectedTier) {
      toast.error("유효하지 않은 리워드 티어입니다")
      return
    }

    try {
      setIsSupporting(true)
      await projectApi.supportProject({
        projectId: project.id,
        rewardTierId: rewardTierId,
        amount: amount,
      })
      
      toast.success("후원이 완료되었습니다!")
      setSupportDialogOpen(false)
      setSupportAmount("")
      setSelectedRewardTier(null)
      
      // 후원 후 상태 체크 (종료 시간이 지났거나 목표 달성했을 수 있음)
      const finalProject = await projectApi.checkAndUpdateProjectStatus(project.id)
      const projectToUse = finalProject || await projectApi.getProject(project.id)
      setProject(projectToUse)
      
      // 상태 변경 알림
      if (projectToUse.status === 'SUCCESS' && project.status === 'OPEN') {
        toast.success("축하합니다! 프로젝트가 목표 금액을 달성했습니다!")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "후원에 실패했습니다")
    } finally {
      setIsSupporting(false)
    }
  }

  // 금액 포맷팅
  const formatAmount = (value: string) => {
    const num = value.replace(/,/g, "")
    if (num === "") return ""
    return parseInt(num, 10).toLocaleString()
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
      console.error("Missing or invalid date strings:", { startAt: project.startAt, endAt: project.endAt })
      throw new Error("프로젝트 날짜 정보가 없습니다")
    }

    console.log("날짜 파싱 시작:", { startAt: project.startAt, endAt: project.endAt })
    
    startTime = new Date(project.startAt)
    endTime = new Date(project.endAt)
    const now = new Date()
    
    console.log("날짜 파싱 결과:", {
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      startTimeValid: !isNaN(startTime.getTime()),
      endTimeValid: !isNaN(endTime.getTime())
    })
    
    // Invalid Date 체크
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error("Invalid date in project:", { 
        startAt: project.startAt, 
        endAt: project.endAt,
        startTime: startTime.toString(),
        endTime: endTime.toString()
      })
      throw new Error("프로젝트 날짜 정보가 유효하지 않습니다")
    }
    
    daysLeft = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } catch (dateError) {
    console.error("날짜 파싱 에러:", dateError)
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {dateError instanceof Error ? dateError.message : "프로젝트 날짜 정보 처리 중 오류가 발생했습니다"}
            </AlertDescription>
          </Alert>
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
              const hasMultipleImages = images.length > 1

              return (
                <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={images[selectedImageIndex] || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-cover"
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
                  {project.status === "OPEN" && (
                    <Badge className="absolute right-4 top-4 bg-primary">진행 중</Badge>
                  )}
                  {project.status === "SUCCESS" && (
                    <Badge className="absolute right-4 top-4 bg-green-500">성공</Badge>
                  )}
                  {project.status === "FAILED" && (
                    <Badge variant="destructive" className="absolute right-4 top-4">실패</Badge>
                  )}
                </div>
              )
            })()}

            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="mb-3 text-balance text-3xl font-bold leading-tight md:text-4xl">{project.title}</h1>
              <p className="mb-4 text-pretty text-lg text-muted-foreground">{project.description}</p>

              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (!project) return
                    const newState = toggleWishlist(project.id, "project")
                    setIsFavorite(newState)
                    if (newState) {
                      toast.success("찜하기에 추가되었습니다")
                    } else {
                      toast.info("찜하기에서 제거되었습니다")
                    }
                  }}
                >
                  <Heart className={`mr-2 size-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  찜하기
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 size-4" />
                  공유하기
                </Button>
                
                {/* 판매자 전용 버튼 */}
                {canEditProject(project, user) && (
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
                    onClick={handleCancelProject}
                  >
                    <X className="mr-2 size-4" />
                    취소하기
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
                  {project.rewardTiers.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      id={String(reward.id)}
                      title={reward.title}
                      amount={reward.price}
                      description={reward.description}
                      items={[]}
                      estimatedDelivery="예정일 미정"
                      limited={reward.limitQuantity || undefined}
                      remaining={reward.limitQuantity ? reward.limitQuantity - reward.soldQuantity : undefined}
                      backers={reward.soldQuantity}
                      featured={false}
                    />
                  ))}
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
                    <Progress value={progress} className="h-2" />
                    <div className="mt-2 text-right text-sm font-medium">{progress.toFixed(0)}% 달성</div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-4" />
                        <span className="text-xs">참여자</span>
                      </div>
                      <p className="text-xl font-bold">
                        {project.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0).toLocaleString()}명
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
                </CardContent>
              </Card>

              {/* 후원하기 버튼 */}
              {project.status === "OPEN" && (
                <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full" disabled={!isAuthenticated}>
                      {isAuthenticated ? "후원하기" : "로그인 후 후원하기"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>프로젝트 후원하기</DialogTitle>
                      <DialogDescription>
                        리워드 티어를 선택하고 후원 금액을 입력해주세요
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* 리워드 티어 선택 */}
                      <div className="space-y-2">
                        <Label>리워드 티어 선택 *</Label>
                        <div className="space-y-2">
                          {project.rewardTiers.map((tier) => (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => {
                                setSelectedRewardTier(tier.id)
                                setSupportAmount(tier.price.toLocaleString())
                              }}
                              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                                selectedRewardTier === tier.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{tier.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {tier.price.toLocaleString()}원
                                  </div>
                                </div>
                                {selectedRewardTier === tier.id && (
                                  <CheckCircle2 className="size-5 text-primary" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 후원 금액 입력 */}
                      <div className="space-y-2">
                        <Label htmlFor="supportAmount">후원 금액 (원) *</Label>
                        <Input
                          id="supportAmount"
                          type="text"
                          value={supportAmount}
                          onChange={(e) => {
                            const formatted = formatAmount(e.target.value)
                            setSupportAmount(formatted)
                          }}
                          placeholder={selectedRewardTier 
                            ? project.rewardTiers.find(t => t.id === selectedRewardTier)?.price.toLocaleString() || "10,000"
                            : "10,000"
                          }
                        />
                        {selectedRewardTier && (
                          <p className="text-xs text-muted-foreground">
                            선택한 리워드 티어: {project.rewardTiers.find(t => t.id === selectedRewardTier)?.price.toLocaleString()}원
                          </p>
                        )}
                        {!selectedRewardTier && project.rewardTiers.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            리워드 티어를 선택하거나 직접 금액을 입력해주세요
                          </p>
                        )}
                      </div>

                      {/* 후원 버튼 */}
                      <Button
                        onClick={handleSupport}
                        disabled={!supportAmount || isSupporting || (project.rewardTiers.length === 0)}
                        className="w-full"
                      >
                        {isSupporting ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            후원 중...
                          </>
                        ) : (
                          "후원하기"
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
