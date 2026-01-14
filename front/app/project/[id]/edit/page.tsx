"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/src/components/protected-route"
import { MultiImageUpload } from "@/src/components/multi-image-upload"
import { RewardTierForm, RewardTierFormData } from "@/src/components/reward-tier-form"
import { projectApi } from "@/src/services/api"
import { projectCreateSchema, ProjectCreateFormData } from "@/src/lib/validations"
import { canEditProject } from "@/src/lib/permissions"
import { useAuth } from "@/src/contexts/auth-context"
import { toast } from "sonner"
import { isoToDateLocal } from "@/src/lib/date-utils"

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const projectId = parseInt(id, 10)
  
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [removedExistingImageIndices, setRemovedExistingImageIndices] = useState<Set<number>>(new Set())
  const [rewardTiers, setRewardTiers] = useState<RewardTierFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<string>("")

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProjectCreateFormData>({
    resolver: zodResolver(projectCreateSchema),
  })

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProject = async () => {
      if (isNaN(projectId)) {
        toast.error("유효하지 않은 프로젝트 ID입니다")
        router.push("/")
        return
      }

      try {
        setLoading(true)
        const projectData = await projectApi.getProject(projectId)
        
        // 권한 체크
        if (!canEditProject(projectData, user)) {
          toast.error("수정할 수 없는 프로젝트입니다")
          router.push(`/project/${projectId}`)
          return
        }

        setProject(projectData)

        // 기존 이미지 URL 저장
        if (projectData.imageUrls && projectData.imageUrls.length > 0) {
          setExistingImageUrls(projectData.imageUrls)
        } else if (projectData.imageUrl) {
          setExistingImageUrls([projectData.imageUrl])
        }

        // 날짜를 YYYY-MM-DD 형식으로 변환 (한국 시간 기준)
        const startDateStr = isoToDateLocal(projectData.startAt)
        const endDateStr = isoToDateLocal(projectData.endAt)

        // 리워드 티어 데이터 변환
        const tiers: RewardTierFormData[] = projectData.rewardTiers.map((tier) => ({
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
        }))

        setRewardTiers(tiers)
        setStartDate(startDateStr)

        // 폼에 데이터 채우기
        reset({
          title: projectData.title,
          description: projectData.description,
          targetAmount: projectData.targetAmount,
          startAt: startDateStr,
          endAt: endDateStr,
          rewardTiers: tiers as any,
          categoryPath: projectData.categoryPath || undefined,
          tags: projectData.tags || undefined,
          summary: projectData.summary || undefined,
        })
      } catch (error) {
        console.error("프로젝트 로드 실패:", error)
        toast.error("프로젝트를 불러오는데 실패했습니다")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, router, user, reset])

  // 리워드 티어 변경 시 폼에 반영
  useEffect(() => {
    setValue("rewardTiers", rewardTiers as any)
  }, [rewardTiers, setValue])

  const onSubmit = async (data: ProjectCreateFormData) => {
    if (!project) return

    try {
      setIsSubmitting(true)

      // 이미지 처리: 새로 업로드한 파일이 있으면 base64로 변환, 없으면 기존 이미지 유지
      let imageUrls: string[] | null = null
      if (imageFiles.length > 0) {
        // 새 이미지 업로드
        imageUrls = await Promise.all(
          imageFiles.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error(`이미지 크기가 너무 큽니다: ${file.name} (최대 5MB)`)
                  reject(new Error(`이미지 크기 초과: ${file.name}`))
                  return
                }
                
                const reader = new FileReader()
                reader.onload = () => {
                  const result = reader.result as string
                  if (result.length > 2 * 1024 * 1024) {
                    toast.warning(`이미지 ${file.name}의 크기가 큽니다. 저장 시 문제가 발생할 수 있습니다.`)
                  }
                  resolve(result)
                }
                reader.onerror = reject
                reader.readAsDataURL(file)
              })
          )
        )
      } else if (existingImageUrls.length > 0) {
        // 기존 이미지 유지
        imageUrls = existingImageUrls
      }

      const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null

      // 날짜 유효성 검사 및 ISO 형식으로 변환
      if (!data.startAt || !data.endAt || data.startAt.trim() === "" || data.endAt.trim() === "") {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      const startDateStr = data.startAt.trim()
      const endDateStr = data.endAt.trim()

      const startDateWithTime = startDateStr.includes("T") ? startDateStr : `${startDateStr}T00:00:00`
      const endDateWithTime = endDateStr.includes("T") ? endDateStr : `${endDateStr}T23:59:59`

      const startDateObj = new Date(startDateWithTime)
      const endDateObj = new Date(endDateWithTime)

      if (isNaN(startDateObj.getTime())) {
        toast.error(`유효하지 않은 시작일입니다: ${startDateStr}`)
        return
      }

      if (isNaN(endDateObj.getTime())) {
        toast.error(`유효하지 않은 종료일입니다: ${endDateStr}`)
        return
      }

      if (endDateObj <= startDateObj) {
        toast.error("종료일은 시작일 이후여야 합니다")
        return
      }

      const startDateISO = startDateObj.toISOString()
      const endDateISO = endDateObj.toISOString()

      // 프로젝트 수정
      const updatedProject = await projectApi.updateProject(projectId, {
        ...data,
        startAt: startDateISO,
        endAt: endDateISO,
        imageUrl,
        imageUrls,
        rewardTiers: rewardTiers.map((tier) => ({
          id: 0, // 수정 시 ID는 백엔드에서 처리
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
          soldQuantity: 0, // 수정 시 판매량은 유지되어야 하지만 Mock API에서는 0으로 설정
        })),
        // currentAmount와 status는 수정하지 않음
      })

      toast.success("프로젝트가 수정되었습니다!")
      router.push(`/project/${projectId}`)
    } catch (error) {
      console.error("프로젝트 수정 에러:", error)
      toast.error(error instanceof Error ? error.message : "프로젝트 수정에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>프로젝트를 찾을 수 없습니다</AlertDescription>
            </Alert>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-2xl">프로젝트 수정</CardTitle>
              <CardDescription>프로젝트 정보를 수정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 프로젝트 이미지 */}
                <div className="space-y-2">
                  <Label>프로젝트 이미지 *</Label>
                  <MultiImageUpload 
                    value={imageFiles} 
                    onChange={setImageFiles} 
                    maxImages={3}
                    existingImages={existingImageUrls}
                    onExistingImagesChange={setRemovedExistingImageIndices}
                  />
                  {imageFiles.length === 0 && existingImageUrls.length === 0 && (
                    <p className="text-sm text-muted-foreground">프로젝트를 대표할 이미지를 업로드해주세요</p>
                  )}
                </div>

                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">프로젝트 제목 *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="예: 스마트 홈 IoT 조명 시스템"
                  />
                  {errors.title && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.title.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 요약 */}
                <div className="space-y-2">
                  <Label htmlFor="summary">프로젝트 요약 (선택)</Label>
                  <Input
                    id="summary"
                    {...register("summary")}
                    placeholder="프로젝트를 한 줄로 요약해주세요 (최대 200자)"
                    maxLength={200}
                  />
                  {errors.summary && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.summary.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description">프로젝트 설명 *</Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={6}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="프로젝트에 대한 상세한 설명을 작성해주세요..."
                  />
                  {errors.description && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.description.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 카테고리 경로 */}
                <div className="space-y-2">
                  <Label htmlFor="categoryPath">카테고리 경로 (선택)</Label>
                  <Input
                    id="categoryPath"
                    {...register("categoryPath")}
                    placeholder="예: Tech/IoT/SmartHome (최대 100자)"
                    maxLength={100}
                  />
                  {errors.categoryPath && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.categoryPath.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 태그 */}
                <div className="space-y-2">
                  <Label htmlFor="tags">태그 (선택)</Label>
                  <Input
                    id="tags"
                    {...register("tags")}
                    placeholder="예: IoT, 스마트홈, 조명, 자동화 (쉼표로 구분, 최대 500자)"
                    maxLength={500}
                  />
                  {errors.tags && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.tags.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 목표 금액 */}
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">목표 금액 (원) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="1"
                    step="1"
                    {...register("targetAmount", { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        if (e.target.value === "0") {
                          e.target.value = ""
                        }
                      }
                    })}
                    placeholder="1000000"
                  />
                  {errors.targetAmount && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.targetAmount.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">프로젝트 시작일 *</Label>
                    <Input
                      id="startAt"
                      type="date"
                      min={today}
                      {...register("startAt", {
                        onChange: (e) => {
                          setStartDate(e.target.value)
                        },
                      })}
                    />
                    {errors.startAt && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.startAt.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endAt">프로젝트 종료일 *</Label>
                    <Input
                      id="endAt"
                      type="date"
                      min={startDate || today}
                      {...register("endAt")}
                    />
                    {errors.endAt && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.endAt.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* 리워드 티어 */}
                <div className="space-y-2">
                  <RewardTierForm tiers={rewardTiers} onChange={setRewardTiers} />
                  {errors.rewardTiers && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.rewardTiers.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/project/${projectId}`)}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        수정 중...
                      </>
                    ) : (
                      "프로젝트 수정"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
