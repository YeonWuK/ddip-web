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
import { AlertCircle, Loader2, Star } from "lucide-react"
import { ProtectedRoute } from "@/src/components/protected-route"
import { MultiImageUpload } from "@/src/components/multi-image-upload"
import { RewardTierForm, RewardTierFormData } from "@/src/components/reward-tier-form"
import { projectApi } from "@/src/services/api"
import { projectCreateSchema, ProjectCreateFormData } from "@/src/lib/validations"
import { toast } from "sonner"

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

export default function CreateProjectPage() {
  const router = useRouter()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [rewardTiers, setRewardTiers] = useState<RewardTierFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [mainIndex, setMainIndex] = useState<number | undefined>(0) // 기본값: 첫 번째 이미지

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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

  const selectedCategory = watch("categoryPath")
  const availableTags = selectedCategory ? CATEGORY_TAG_OPTIONS[selectedCategory] ?? [] : []

  // 이미지 변경 시 대표 이미지 인덱스 조정
  useEffect(() => {
    if (imageFiles.length === 0) {
      setMainIndex(undefined)
    } else if (mainIndex === undefined) {
      setMainIndex(0) // 이미지가 추가되면 첫 번째를 대표로
    } else if (mainIndex >= imageFiles.length) {
      setMainIndex(imageFiles.length - 1) // 인덱스가 범위를 벗어나면 마지막 이미지로
    }
  }, [imageFiles, mainIndex])

  // 대표 이미지 변경 핸들러
  const handleMainImageChange = (type: 'existing' | 'new', idOrIndex: number) => {
    if (type === 'new') {
      setMainIndex(idOrIndex)
    }
  }

  const onSubmit = async (data: ProjectCreateFormData) => {
    try {
      setIsSubmitting(true)

      // 이미지 파일 필수 체크
      if (imageFiles.length === 0) {
        toast.error("프로젝트 이미지를 최소 1개 이상 업로드해주세요")
        setIsSubmitting(false)
        return
      }

      // 파일 크기 체크 (5MB 제한)
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

      // 백엔드 ProjectRequestDto 형식
      const projectRequest: any = {
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

      // 대표 이미지 인덱스 지정
      if (mainIndex !== undefined) {
        projectRequest.mainIndex = mainIndex
      }

      // 검증용 로그: 전송 데이터 확인
      console.log('[프로젝트 생성] 이미지 파일 목록:', imageFiles.map((f, i) => `[${i}] ${f.name}`))
      console.log('[프로젝트 생성] mainIndex:', mainIndex)
      console.log('[프로젝트 생성] 대표 이미지로 선택된 파일:', mainIndex !== undefined ? imageFiles[mainIndex]?.name : '없음')
      console.log('[프로젝트 생성] projectRequest:', JSON.stringify(projectRequest, null, 2))

      const createdProject = await projectApi.createProject(imageFiles, projectRequest)
      toast.success("프로젝트가 생성되었습니다!")
      router.push(`/project/${createdProject.id}`)
    } catch (error) {
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
                  <MultiImageUpload 
                    value={imageFiles} 
                    onChange={setImageFiles}
                    enableMainImageSelection={true}
                    selectedMainIndex={mainIndex}
                    onMainImageChange={handleMainImageChange}
                  />
                  {imageFiles.length === 0 && (
                    <p className="text-sm text-muted-foreground">프로젝트를 대표할 이미지를 업로드해주세요</p>
                  )}
                  {mainIndex !== undefined && imageFiles.length > 0 && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400" />
                      대표 이미지: {mainIndex + 1}번째 이미지
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
