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
import { AlertCircle, Loader2, Star } from "lucide-react"
import { ProtectedRoute } from "@/src/components/protected-route"
import { MultiImageUpload } from "@/src/components/multi-image-upload"
import { RewardTierForm, RewardTierFormData } from "@/src/components/reward-tier-form"
import { projectApi } from "@/src/services/api"
import { projectCreateSchema, ProjectCreateFormData } from "@/src/lib/validations"
import { canEditProject } from "@/src/lib/permissions"
import { useAuth } from "@/src/contexts/auth-context"
import { toast } from "sonner"
import { isoToDateLocal } from "@/src/lib/date-utils"

const CATEGORY_TAG_OPTIONS: Record<string, string[]> = {
  "가전제품": [
    "TV",
    "냉장고",
    "세탁기",
    "건조기",
    "에어컨",
    "공기청정기",
    "청소기",
    "식기세척기",
    "전자레인지",
    "오븐",
    "인덕션",
    "정수기",
    "가습기",
    "제습기",
    "안마의자",
    "기타",
  ],
  "디지털/IT": [
    "스마트폰",
    "태블릿",
    "노트북",
    "데스크탑",
    "모니터",
    "키보드",
    "마우스",
    "이어폰",
    "헤드폰",
    "스마트워치",
    "카메라",
    "게임기",
    "드론",
    "프린터",
    "저장장치",
    "기타",
  ],
  "가구/인테리어": [
    "소파",
    "침대",
    "매트리스",
    "책상",
    "의자",
    "수납장",
    "책장",
    "조명",
    "커튼",
    "카펫",
    "거울",
    "테이블",
    "행거",
    "인테리어소품",
    "기타",
  ],
  "주방/생활용품": [
    "조리도구",
    "식기",
    "텀블러",
    "보관용기",
    "밀폐용기",
    "세제",
    "휴지",
    "수건",
    "청소용품",
    "욕실용품",
    "세탁용품",
    "생활잡화",
    "기타",
  ],
  "뷰티/패션": [
    "스킨케어",
    "메이크업",
    "향수",
    "헤어케어",
    "바디케어",
    "의류",
    "신발",
    "가방",
    "액세서리",
    "주얼리",
    "패션잡화",
    "기타",
  ],
  "스포츠/취미": [
    "헬스",
    "요가",
    "러닝",
    "자전거",
    "캠핑",
    "등산",
    "낚시",
    "골프",
    "수영",
    "축구",
    "농구",
    "악기",
    "프라모델",
    "보드게임",
    "기타",
  ],
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const projectId = parseInt(id, 10)
  
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImageItems, setExistingImageItems] = useState<{ id: number; url: string }[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(new Set())
  const [rewardTiers, setRewardTiers] = useState<RewardTierFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  
  // 대표 이미지 선택 상태
  const [mainImageId, setMainImageId] = useState<number | undefined>(undefined) // 기존 이미지
  const [mainIndex, setMainIndex] = useState<number | undefined>(undefined) // 새 이미지

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
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

        // 기존 이미지 (id+url) 저장 - X 버튼으로 제거 시 imageIds 전송용
        if (projectData.imageItems && projectData.imageItems.length > 0) {
          setExistingImageItems(projectData.imageItems)
          // 대표 이미지 설정: mainImageId가 있으면 사용, 없으면 첫 번째
          const mainId = projectData.mainImageId
          const validMainId =
            mainId != null && projectData.imageItems.some((item) => item.id === mainId)
              ? mainId
              : projectData.imageItems[0]?.id
          if (validMainId != null) {
            setMainImageId(validMainId)
          }
        } else if (projectData.imageUrls && projectData.imageUrls.length > 0) {
          setExistingImageItems(projectData.imageUrls.map((url, i) => ({ id: 0, url })))
        } else if (projectData.imageUrl) {
          setExistingImageItems([{ id: 0, url: projectData.imageUrl }])
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
      } catch {
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

  const selectedCategory = watch("categoryPath")
  const availableTags = selectedCategory ? CATEGORY_TAG_OPTIONS[selectedCategory] ?? [] : []

  // 이미지 삭제 시 대표 이미지 상태 조정
  useEffect(() => {
    // 기존 이미지 중 대표 이미지가 삭제된 경우
    if (mainImageId !== undefined && removedImageIds.has(mainImageId)) {
      // 남아있는 첫 번째 기존 이미지를 대표로 설정
      const remainingExisting = existingImageItems.find(item => !removedImageIds.has(item.id))
      if (remainingExisting) {
        setMainImageId(remainingExisting.id)
      } else if (imageFiles.length > 0) {
        // 기존 이미지가 모두 삭제되었고 새 이미지가 있으면 첫 번째 새 이미지를 대표로
        setMainImageId(undefined)
        setMainIndex(0)
      } else {
        // 모든 이미지가 삭제된 경우
        setMainImageId(undefined)
        setMainIndex(undefined)
      }
    }
  }, [removedImageIds, mainImageId, existingImageItems, imageFiles])

  // 새 이미지 삭제 시 대표 이미지 인덱스 조정
  useEffect(() => {
    if (mainIndex !== undefined && mainIndex >= imageFiles.length) {
      // 대표 이미지로 선택된 새 이미지가 삭제된 경우
      if (imageFiles.length > 0) {
        setMainIndex(0) // 첫 번째 새 이미지를 대표로
      } else {
        // 새 이미지가 모두 삭제되고 기존 이미지가 있으면 첫 번째 기존 이미지를 대표로
        const remainingExisting = existingImageItems.find(item => !removedImageIds.has(item.id))
        if (remainingExisting) {
          setMainIndex(undefined)
          setMainImageId(remainingExisting.id)
        } else {
          setMainIndex(undefined)
        }
      }
    }
  }, [imageFiles, mainIndex, existingImageItems, removedImageIds])

  // 대표 이미지 변경 핸들러
  const handleMainImageChange = (type: 'existing' | 'new', idOrIndex: number) => {
    if (type === 'existing') {
      const selectedItem = existingImageItems.find((item) => item.id === idOrIndex)
      console.log('[프로젝트 수정] 대표 이미지 변경 → 기존 이미지 선택', {
        mainImageId: idOrIndex,
        imageUrl: selectedItem?.url ?? '(url 없음)',
      })
      setMainImageId(idOrIndex)
      setMainIndex(undefined) // 새 이미지 선택 해제
    } else {
      const selectedFile = imageFiles[idOrIndex]
      console.log('[프로젝트 수정] 대표 이미지 변경 → 새 이미지 선택', {
        mainIndex: idOrIndex,
        fileName: selectedFile?.name ?? '(파일 없음)',
        fileSize: selectedFile?.size,
      })
      setMainIndex(idOrIndex)
      setMainImageId(undefined) // 기존 이미지 선택 해제
    }
  }

  const onSubmit = async (data: ProjectCreateFormData) => {
    if (!project) return

    try {
      setIsSubmitting(true)

      // 유지되는 기존 이미지 + 새 이미지 최소 1개 필요
      const keptExistingCount = existingImageItems.filter(
        (item) => !removedImageIds.has(item.id)
      ).length
      if (keptExistingCount + imageFiles.length === 0) {
        toast.error("프로젝트 이미지를 최소 1개 이상 유지해주세요")
        setIsSubmitting(false)
        return
      }

      // 새 이미지 파일 크기 검사
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`이미지 크기가 너무 큽니다: ${file.name} (최대 5MB)`)
          setIsSubmitting(false)
          return
        }
      }

      // 날짜 유효성 검사 및 ISO 형식으로 변환
      if (!data.startAt || !data.endAt || data.startAt.trim() === "" || data.endAt.trim() === "") {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      const startDateStr = data.startAt.trim().split("T")[0] // YYYY-MM-DD
      const endDateStr = data.endAt.trim().split("T")[0] // YYYY-MM-DD

      const startDateObj = new Date(startDateStr)
      const endDateObj = new Date(endDateStr)

      if (isNaN(startDateObj.getTime())) {
        toast.error(`유효하지 않은 시작일입니다: ${startDateStr}`)
        return
      }

      if (isNaN(endDateObj.getTime())) {
        toast.error(`유효하지 않은 종료일입니다: ${endDateStr}`)
        return
      }

      if (endDateObj < startDateObj) {
        toast.error("종료일은 시작일 이후여야 합니다")
        return
      }

      // 백엔드 LocalDate 형식(YYYY-MM-DD)으로 전송 (toISOString 사용 시 UTC 변환으로 하루 밀림 발생)
      const startDateISO = startDateStr
      const endDateISO = endDateStr

      // X 버튼으로 제거한 기존 이미지 ID 목록
      const deleteImageIds = Array.from(removedImageIds).filter((id) => id > 0)

      // 프로젝트 수정 (multipart/form-data)
      const updateData: any = {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        startAt: startDateISO,
        endAt: endDateISO,
        categoryPath: data.categoryPath || null,
        tags: data.tags || null,
        summary: data.summary || null,
        rewardTiers: rewardTiers.map((tier) => ({
          title: tier.title,
          description: tier.description,
          price: tier.price,
          limitQuantity: tier.limitQuantity,
        })),
      }

      // 삭제할 이미지 ID 목록
      if (deleteImageIds.length > 0) {
        updateData.deleteImageIds = deleteImageIds
      }

      // 대표 이미지 지정 - mainIndex와 mainImageId는 동시에 보낼 수 없음
      // - 기존 이미지 선택 → mainImageId만
      // - 새 이미지 선택 → mainIndex만
      if (mainImageId !== undefined && !removedImageIds.has(mainImageId)) {
        updateData.mainImageId = mainImageId
        console.log('[프로젝트 수정] 백엔드 전송 - mainImageId:', mainImageId, '(기존 이미지)')
      } else if (mainIndex !== undefined && mainIndex < imageFiles.length) {
        updateData.mainIndex = mainIndex
        console.log('[프로젝트 수정] 백엔드 전송 - mainIndex:', mainIndex, '(새 이미지, 업로드', imageFiles.length, '장)')
      }

      const updatedProject = await projectApi.updateProject(projectId, imageFiles, updateData)

      toast.success("프로젝트가 수정되었습니다!")
      router.push(`/project/${projectId}`)
    } catch (error) {
      console.error('[프로젝트 수정] 400 에러 상세:', error)
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
                    existingImageItems={existingImageItems}
                    onRemovedIdsChange={setRemovedImageIds}
                    enableMainImageSelection={true}
                    selectedMainImageId={mainImageId}
                    selectedMainIndex={mainIndex}
                    onMainImageChange={handleMainImageChange}
                  />
                  {imageFiles.length === 0 && existingImageItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">프로젝트를 대표할 이미지를 업로드해주세요</p>
                  )}
                  {(mainImageId !== undefined || mainIndex !== undefined) && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400" />
                      대표 이미지가 선택되었습니다
                    </p>
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
                  <Label htmlFor="categoryPath">카테고리</Label>
                  <select
                    id="categoryPath"
                    {...register("categoryPath", {
                      onChange: () => setValue("tags", undefined),
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">카테고리 선택</option>
                    {Object.keys(CATEGORY_TAG_OPTIONS).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.categoryPath && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.categoryPath.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 태그 */}
                <div className="space-y-2">
                  <Label htmlFor="tags">태그</Label>
                  <select
                    id="tags"
                    {...register("tags")}
                    disabled={!selectedCategory}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {selectedCategory ? "태그 선택" : "카테고리를 먼저 선택하세요"}
                    </option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
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
                      setValueAs: (value) => (value === "" ? undefined : Number(value)),
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
