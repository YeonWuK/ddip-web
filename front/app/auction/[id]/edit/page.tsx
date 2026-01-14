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
import { auctionApi } from "@/src/services/api"
import { auctionCreateSchema, AuctionCreateFormData } from "@/src/lib/validations"
import { canEditAuction } from "@/src/lib/permissions"
import { useAuth } from "@/src/contexts/auth-context"
import { toast } from "sonner"
import { isoToDatetimeLocal } from "@/src/lib/date-utils"

export default function EditAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const auctionId = parseInt(id, 10)
  
  const [auction, setAuction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [removedExistingImageIndices, setRemovedExistingImageIndices] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDateTime, setStartDateTime] = useState<string>("")

  // 오늘 날짜와 시간을 datetime-local 형식으로 가져오기
  const now = new Date()
  const today = now.toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AuctionCreateFormData>({
    resolver: zodResolver(auctionCreateSchema),
  })

  const buyoutPrice = watch("buyoutPrice")

  // 경매 데이터 로드
  useEffect(() => {
    const loadAuction = async () => {
      if (isNaN(auctionId)) {
        toast.error("유효하지 않은 경매 ID입니다")
        router.push("/")
        return
      }

      try {
        setLoading(true)
        const auctionData = await auctionApi.getAuction(auctionId)
        
        // 권한 체크
        if (!canEditAuction(auctionData, user)) {
          toast.error("수정할 수 없는 경매입니다")
          router.push(`/auction/${auctionId}`)
          return
        }

        setAuction(auctionData)

        // 기존 이미지 URL 저장
        if (auctionData.imageUrls && auctionData.imageUrls.length > 0) {
          setExistingImageUrls(auctionData.imageUrls)
        } else if (auctionData.imageUrl) {
          setExistingImageUrls([auctionData.imageUrl])
        }

        // 날짜를 datetime-local 형식으로 변환 (한국 시간 기준)
        const startDateStr = isoToDatetimeLocal(auctionData.startAt)
        const endDateStr = isoToDatetimeLocal(auctionData.endAt)

        setStartDateTime(startDateStr)

        // 폼에 데이터 채우기
        reset({
          title: auctionData.title,
          description: auctionData.description,
          startPrice: auctionData.startPrice,
          bidStep: auctionData.bidStep,
          buyoutPrice: auctionData.buyoutPrice,
          startAt: startDateStr,
          endAt: endDateStr,
        })
      } catch (error) {
        console.error("경매 로드 실패:", error)
        toast.error("경매를 불러오는데 실패했습니다")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadAuction()
  }, [auctionId, router, user, reset])

  const onSubmit = async (data: AuctionCreateFormData) => {
    if (!auction) return

    try {
      setIsSubmitting(true)

      // 이미지 처리: 제거되지 않은 기존 이미지 + 새로 업로드한 이미지
      const visibleExistingImages = existingImageUrls.filter((_, index) => !removedExistingImageIndices.has(index))

      let imageUrls: string[] | null = null
      
      if (imageFiles.length > 0) {
        // 새 이미지를 base64로 변환
        const newImageUrls = await Promise.all(
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
        // 기존 이미지 + 새 이미지 합치기
        imageUrls = [...visibleExistingImages, ...newImageUrls]
      } else if (visibleExistingImages.length > 0) {
        // 기존 이미지만 유지
        imageUrls = visibleExistingImages
      }

      const imageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null

      // 날짜 유효성 검사 및 ISO 형식으로 변환
      if (!data.startAt || !data.endAt || data.startAt.trim() === "" || data.endAt.trim() === "") {
        toast.error("시작일과 종료일을 모두 선택해주세요")
        return
      }

      const startDateTimeStr = data.startAt.trim()
      const endDateTimeStr = data.endAt.trim()

      const startDateTimeObj = new Date(startDateTimeStr)
      const endDateTimeObj = new Date(endDateTimeStr)

      if (isNaN(startDateTimeObj.getTime())) {
        toast.error(`유효하지 않은 시작일입니다: ${startDateTimeStr}`)
        return
      }

      if (isNaN(endDateTimeObj.getTime())) {
        toast.error(`유효하지 않은 종료일입니다: ${endDateTimeStr}`)
        return
      }

      // 시작일이 과거인지 확인 (수정 시에는 현재 시간 이후만 가능)
      const now = new Date()
      if (startDateTimeObj < now) {
        toast.error("경매 시작일은 현재 시간 이후여야 합니다")
        return
      }

      if (endDateTimeObj <= startDateTimeObj) {
        toast.error("종료일은 시작일 이후여야 합니다")
        return
      }

      const startDateTimeISO = startDateTimeObj.toISOString()
      const endDateTimeISO = endDateTimeObj.toISOString()

      // 경매 수정
      const updatedAuction = await auctionApi.updateAuction(auctionId, {
        ...data,
        startAt: startDateTimeISO,
        endAt: endDateTimeISO,
        imageUrl,
        imageUrls,
        // currentPrice는 수정하지 않음 (입찰이 시작된 경우)
        // status는 수정하지 않음
        // winner는 수정하지 않음
      })

      toast.success("경매가 수정되었습니다!")
      router.push(`/auction/${auctionId}`)
    } catch (error) {
      console.error("경매 수정 에러:", error)
      toast.error(error instanceof Error ? error.message : "경매 수정에 실패했습니다")
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

  if (!auction) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>경매를 찾을 수 없습니다</AlertDescription>
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
              <CardTitle className="text-2xl">경매 수정</CardTitle>
              <CardDescription>경매 정보를 수정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 경매 이미지 */}
                <div className="space-y-2">
                  <Label>경매 상품 이미지 *</Label>
                  <MultiImageUpload 
                    value={imageFiles} 
                    onChange={setImageFiles} 
                    maxImages={3}
                    existingImages={existingImageUrls}
                    onExistingImagesChange={setRemovedExistingImageIndices}
                  />
                  {imageFiles.length === 0 && existingImageUrls.length === 0 && (
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">경매 시작일 *</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      min={today}
                      {...register("startAt", {
                        onChange: (e) => {
                          setStartDateTime(e.target.value)
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
                    <Label htmlFor="endAt">경매 종료일 *</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      min={startDateTime ? (() => {
                        const startDate = new Date(startDateTime)
                        const minEndDate = new Date(startDate.getTime() + 60000)
                        return minEndDate.toISOString().slice(0, 16)
                      })() : today}
                      disabled={!startDateTime}
                      {...register("endAt")}
                    />
                    {!startDateTime && (
                      <p className="text-xs text-muted-foreground">시작일을 먼저 선택해주세요</p>
                    )}
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
                    onClick={() => router.push(`/auction/${auctionId}`)}
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
                      "경매 수정"
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
