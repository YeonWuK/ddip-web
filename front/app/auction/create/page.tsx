"use client"

import { useState } from "react"
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
import { auctionApi } from "@/src/services/api"
import { auctionCreateSchema, AuctionCreateFormData } from "@/src/lib/validations"
import { AuctionCreateRequest } from "@/src/types/api"
import { toast } from "sonner"

export default function CreateAuctionPage() {
  const router = useRouter()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 페이지 진입 시각을 종료일 min으로 사용 (이전 시각 선택 불가)
  const [minEndAt] = useState(() => new Date().toISOString().slice(0, 16))

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AuctionCreateFormData>({
    resolver: zodResolver(auctionCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      startPrice: undefined,
      bidStep: undefined,
      buyoutPrice: null,
      startAt: "",
      endAt: "",
    },
  })

  const buyoutPrice = watch("buyoutPrice")

  const onSubmit = async (data: AuctionCreateFormData) => {
    try {
      setIsSubmitting(true)

      // 이미지 파일 크기 검사 (5MB 제한, 백엔드 S3 업로드용)
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`이미지 크기가 너무 큽니다: ${file.name} (최대 5MB)`)
          setIsSubmitting(false)
          return
        }
      }

      if (!data.endAt || data.endAt.trim() === "") {
        toast.error("종료일을 선택해주세요")
        return
      }

      const endDateTimeStr = data.endAt.trim()
      const endDateTimeObj = new Date(endDateTimeStr)

      if (isNaN(endDateTimeObj.getTime())) {
        toast.error(`유효하지 않은 종료일입니다: ${endDateTimeStr}`)
        return
      }

      // 종료일이 현재보다 이후인지 확인
      if (endDateTimeObj <= new Date()) {
        toast.error("종료일은 현재 시각 이후여야 합니다")
        return
      }

      // 종료 시각 포맷
      const formatLocalDateTime = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, "0")
        const d = String(date.getDate()).padStart(2, "0")
        const hh = String(date.getHours()).padStart(2, "0")
        const mm = String(date.getMinutes()).padStart(2, "0")
        return `${y}-${m}-${d}T${hh}:${mm}:00`
      }
      const endAtFormatted = formatLocalDateTime(endDateTimeObj)

      const auctionData: AuctionCreateRequest = {
        title: data.title,
        description: data.description,
        startPrice: data.startPrice,
        bidStep: data.bidStep,
        endAt: endAtFormatted,
      }

      const createdAuction = await auctionApi.createAuction(imageFiles, auctionData)
      toast.success("경매가 생성되었습니다!")
      router.push(`/auction/${createdAuction.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "경매 생성에 실패했습니다")
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
              <CardTitle className="text-2xl">새 경매 만들기</CardTitle>
              <CardDescription>경매 상품을 등록하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 경매 이미지 */}
                <div className="space-y-2">
                  <Label>경매 상품 이미지 *</Label>
                  <MultiImageUpload value={imageFiles} onChange={setImageFiles} maxImages={3} />
                  {imageFiles.length === 0 && (
                    <p className="text-sm text-muted-foreground">경매 상품을 대표할 이미지를 업로드해주세요 (최대 3장)</p>
                  )}
                </div>

                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title">경매 상품 제목 *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="예: 한정판 빈티지 카메라 콜렉션"
                  />
                  {errors.title && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.title.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description">경매 상품 설명 *</Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={6}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="경매 상품에 대한 상세한 설명을 작성해주세요..."
                  />
                  {errors.description && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{errors.description.message}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 가격 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startPrice">시작가 (원) *</Label>
                    <Input
                      id="startPrice"
                      type="number"
                      min="1000"
                      step="1000"
                      {...register("startPrice", { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          if (e.target.value === "0") {
                            e.target.value = ""
                          }
                        }
                      })}
                      placeholder="50000"
                      defaultValue=""
                    />
                    {errors.startPrice && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.startPrice.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bidStep">입찰 단위 (원) *</Label>
                    <Input
                      id="bidStep"
                      type="number"
                      min="1000"
                      step="1000"
                      {...register("bidStep", { 
                        valueAsNumber: true,
                        onChange: (e) => {
                          if (e.target.value === "0") {
                            e.target.value = ""
                          }
                        }
                      })}
                      placeholder="5000"
                      defaultValue=""
                    />
                    {errors.bidStep && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.bidStep.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* 즉시 구매가 */}
                <div className="space-y-2">
                  <Label htmlFor="buyoutPrice">즉시 구매가 (원) - 선택사항</Label>
                  <Input
                    id="buyoutPrice"
                    type="number"
                    min="1000"
                    step="1000"
                    {...register("buyoutPrice", {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === "" || v === 0 ? null : Number(v)),
                    })}
                    placeholder="200000 (선택사항)"
                  />
                  <p className="text-sm text-muted-foreground">
                    즉시 구매가를 설정하면 해당 금액으로 바로 구매할 수 있습니다
                  </p>
                </div>

                {/* 기간 */}
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                    경매는 <strong className="text-foreground">생성 버튼을 누른 시점에 자동으로 시작</strong>됩니다.
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endAt">경매 종료일 *</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      min={minEndAt}
                      {...register("endAt")}
                    />
                    <p className="text-xs text-muted-foreground">
                      종료일은 이 창에 들어온 시각 이전은 선택할 수 없습니다
                    </p>
                    {errors.endAt && (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.endAt.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
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
                      "경매 생성"
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
