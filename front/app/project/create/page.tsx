"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"

export default function CreateProjectPage() {
  const router = useRouter()
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
  } = useForm<ProjectCreateFormData>({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: undefined,
      startAt: "",
      endAt: "",
      rewardTiers: [],
      categoryPath: undefined,
      tags: undefined,
      summary: undefined,
    },
  })

  // 리워드 티어 변경 시 폼에 반영
  useEffect(() => {
    setValue("rewardTiers", rewardTiers as any)
  }, [rewardTiers, setValue])

  const onSubmit = async (data: ProjectCreateFormData) => {
    try {
      setIsSubmitting(true)

      // 이미지 파일들을 base64로 변환 (localStorage 저장용)
      let imageUrls: string[] | null = null
      if (imageFiles.length > 0) {
        // Mock: 실제로는 FormData로 백엔드에 업로드
        // localStorage 저장을 위해 base64로 변환 (크기 제한 적용)
        imageUrls = await Promise.all(
          imageFiles.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                // 파일 크기 체크 (5MB 제한)
                if (file.size > 5 * 1024 * 1024) {
                  toast.error(`이미지 크기가 너무 큽니다: ${file.name} (최대 5MB)`)
                  reject(new Error(`이미지 크기 초과: ${file.name}`))
                  return
                }
                
                const reader = new FileReader()
                reader.onload = () => {
                  const result = reader.result as string
                  // base64 문자열 크기 체크 (약 2MB 제한)
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
      }
      // 첫 번째 이미지를 imageUrl로 설정 (하위 호환성)
      const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null

      // 날짜 유효성 검사 및 ISO 형식으로 변환
      if (!data.startAt || !data.endAt || data.startAt.trim() === "" || data.endAt.trim() === "") {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      // date input은 YYYY-MM-DD 형식이므로 시간을 추가
      const startDateStr = data.startAt.trim()
      const endDateStr = data.endAt.trim()

      if (!startDateStr || !endDateStr) {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      // date input은 YYYY-MM-DD 형식이므로 시간을 추가
      // 로컬 시간대를 명시적으로 처리하기 위해 시간을 추가
      const startDateWithTime = startDateStr.includes("T") ? startDateStr : `${startDateStr}T00:00:00`
      const endDateWithTime = endDateStr.includes("T") ? endDateStr : `${endDateStr}T23:59:59`

      console.log("날짜 변환 시작:", { startDateStr, endDateStr, startDateWithTime, endDateWithTime })

      // Date 객체 생성
      const startDateObj = new Date(startDateWithTime)
      const endDateObj = new Date(endDateWithTime)

      console.log("Date 객체 생성 결과:", { 
        startDateObj: startDateObj.toString(), 
        endDateObj: endDateObj.toString(),
        startIsValid: !isNaN(startDateObj.getTime()),
        endIsValid: !isNaN(endDateObj.getTime())
      })

      // Invalid Date 체크
      if (isNaN(startDateObj.getTime())) {
        console.error("시작일 파싱 실패:", startDateStr, startDateWithTime)
        toast.error(`유효하지 않은 시작일입니다: ${startDateStr}`)
        return
      }

      if (isNaN(endDateObj.getTime())) {
        console.error("종료일 파싱 실패:", endDateStr, endDateWithTime)
        toast.error(`유효하지 않은 종료일입니다: ${endDateStr}`)
        return
      }

      if (endDateObj <= startDateObj) {
        toast.error("종료일은 시작일 이후여야 합니다")
        return
      }

      // ISO 형식으로 변환
      let startDateISO: string
      let endDateISO: string

      try {
        startDateISO = startDateObj.toISOString()
        endDateISO = endDateObj.toISOString()
        console.log("ISO 변환 성공:", { startDateISO, endDateISO })
      } catch (error) {
        console.error("ISO 변환 실패:", error, { 
          startDateObj, 
          endDateObj,
          startDateStr,
          endDateStr
        })
        toast.error("날짜 변환 중 오류가 발생했습니다")
        return
      }

      const projectData = {
        ...data,
        startAt: startDateISO,
        endAt: endDateISO,
        imageUrl,
        imageUrls,
        rewardTiers: rewardTiers.map((tier) => ({
          id: 0,
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
          soldQuantity: 0,
        })),
        currentAmount: 0,
        status: "OPEN" as const, // 프로젝트 생성 시 바로 진행 중 상태로 설정
      }

      console.log("API 호출 전 데이터:", projectData)
      
      const createdProject = await projectApi.createProject(projectData)
      console.log("API 호출 성공:", createdProject)
      
      toast.success("프로젝트가 생성되었습니다!")
      router.push(`/project/${createdProject.id}`)
    } catch (error) {
      console.error("프로젝트 생성 에러:", error)
      toast.error(error instanceof Error ? error.message : "프로젝트 생성에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-2xl">새 프로젝트 만들기</CardTitle>
              <CardDescription>크라우드펀딩 프로젝트를 등록하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 프로젝트 이미지 */}
                <div className="space-y-2">
                  <Label>프로젝트 이미지 *</Label>
                  <MultiImageUpload value={imageFiles} onChange={setImageFiles} maxImages={3} />
                  {imageFiles.length === 0 && (
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
                    defaultValue=""
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
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "프로젝트 생성"
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
