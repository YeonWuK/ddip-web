"use client"

import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Separator } from "@/src/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Progress } from "@/src/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Calendar, Clock, Heart, Share2, TrendingUp, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, use } from "react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { projectApi } from "@/src/services/api"
import { ProjectResponse } from "@/src/types/api"
import { RewardCard } from "@/src/components/reward-card"
import { toast } from "sonner"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const progress = (project.currentAmount / project.targetAmount) * 100
  const startTime = new Date(project.startAt)
  const endTime = new Date(project.endAt)
  const now = new Date()
  const daysLeft = Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src={project.imageUrl || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover"
              />
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

            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="mb-3 text-balance text-3xl font-bold leading-tight md:text-4xl">{project.title}</h1>
              <p className="mb-4 text-pretty text-lg text-muted-foreground">{project.description}</p>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 size-4" />
                  좋아요
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 size-4" />
                  공유하기
                </Button>
              </div>
            </div>

            {/* Creator info */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="size-12">
                    <AvatarImage
                      src={project.creator.profileImageUrl || "/placeholder.svg"}
                      alt={project.creator.nickname}
                    />
                    <AvatarFallback>{project.creator.nickname[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.creator.nickname}</CardTitle>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {project.creator.email || "이메일 없음"}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

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
                      <p className="text-xl font-bold">{daysLeft > 0 ? `${daysLeft}일` : "종료"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project info */}
              <Card>
                <CardContent className="space-y-3 pt-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">프로젝트 시작</span>
                    <span className="font-semibold">{startTime.toLocaleDateString("ko-KR")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">프로젝트 종료</span>
                    <span className="font-semibold">{endTime.toLocaleDateString("ko-KR")}</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
