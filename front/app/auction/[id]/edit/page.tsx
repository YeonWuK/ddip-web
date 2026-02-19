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
import { auctionApi } from "@/src/services/api"
import type { AuctionUpdateRequest } from "@/src/types/api"
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
  const [existingImageItems, setExistingImageItems] = useState<{ id: number; url: string }[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDateTime, setStartDateTime] = useState<string>("")
  
  // 대표 이미지 선택 상태 (project edit와 동일)
  const [mainImageId, setMainImageId] = useState<number | undefined>(undefined)
  const [mainIndex, setMainIndex] = useState<number | undefined>(undefined)

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

        // 기존 이미지 (id+url) 저장 - project와 동일 방식
        if (auctionData.imageItems && auctionData.imageItems.length > 0) {
          setExistingImageItems(auctionData.imageItems)
          const mainId = auctionData.mainImageId
          const validMainId =
            mainId != null && auctionData.imageItems.some((item) => item.id === mainId)
              ? mainId
              : auctionData.imageItems[0]?.id
          if (validMainId != null) {
            setMainImageId(validMainId)
          }
        } else if (auctionData.imageUrls && auctionData.imageUrls.length > 0) {
          setExistingImageItems(auctionData.imageUrls.map((url, i) => ({ id: i + 1, url })))
        } else if (auctionData.imageUrl) {
          setExistingImageItems([{ id: 1, url: auctionData.imageUrl }])
        }

        // 날짜를 datetime-local 형식으로 변환 (한국 시간 기준)
        const startDateStr = isoToDatetimeLocal(auctionData.startAt)
        const endDateStr = isoToDatetimeLocal(auctionData.endAt)

        // startDateTime은 종료일의 최소값 계산에 사용 (경매 시작 시간은 수정 불가)
        setStartDateTime(startDateStr)

        // 폼에 데이터 채우기 (startAt은 수정 불가이므로 제외)
        reset({
          title: auctionData.title,
          description: auctionData.description,
          startPrice: auctionData.startPrice,
          bidStep: auctionData.bidStep,
          buyoutPrice: auctionData.buyoutPrice,
          endAt: endDateStr,
        })
      } catch {
        toast.error("경매를 불러오는데 실패했습니다")
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    loadAuction()
  }, [auctionId, router, user, reset])

  // 이미지 삭제 시 대표 이미지 상태 조정
  useEffect(() => {
    if (mainImageId !== undefined && removedImageIds.has(mainImageId)) {
      const remainingExisting = existingImageItems.find((item) => !removedImageIds.has(item.id))
      if (remainingExisting) {
        setMainImageId(remainingExisting.id)
      } else if (imageFiles.length > 0) {
        setMainImageId(undefined)
        setMainIndex(0)
      } else {
        setMainImageId(undefined)
        setMainIndex(undefined)
      }
    }
  }, [removedImageIds, mainImageId, existingImageItems, imageFiles])

  // 새 이미지 삭제 시 대표 이미지 인덱스 조정
  useEffect(() => {
    if (mainIndex !== undefined && mainIndex >= imageFiles.length) {
      if (imageFiles.length > 0) {
        setMainIndex(0)
      } else {
        const remainingExisting = existingImageItems.find((item) => !removedImageIds.has(item.id))
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
      setMainImageId(idOrIndex)
      setMainIndex(undefined)
    } else {
      setMainIndex(idOrIndex)
      setMainImageId(undefined)
    }
  }

  const onSubmit = async (data: AuctionCreateFormData) => {
    if (!auction) return

    try {
      setIsSubmitting(true)

      // 유지되는 기존 이미지 + 새 이미지 최소 1개 필요
      const keptExistingCount = existingImageItems.filter(
        (item) => !removedImageIds.has(item.id)
      ).length
      if (keptExistingCount + imageFiles.length === 0) {
        toast.error("경매 상품 이미지를 최소 1개 이상 유지해주세요")
        setIsSubmitting(false)
        return
      }

      // 이미지 파일 크기 검증
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`이미지 크기가 너무 큽니다: ${file.name} (최대 5MB)`)
          setIsSubmitting(false)
          return
        }
      }

      // 날짜 유효성 검사 및 ISO 형식으로 변환
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

      // 종료일이 현재 경매 시작일 이후인지 확인
      const auctionStartDate = new Date(auction.startAt)
      if (endDateTimeObj <= auctionStartDate) {
        toast.error("종료일은 경매 시작일 이후여야 합니다")
        return
      }

      // 종료일이 현재 시간 이후인지 확인
      const now = new Date()
      if (endDateTimeObj <= now) {
        toast.error("종료일은 현재 시간 이후여야 합니다")
        return
      }

      const endDateTimeISO = endDateTimeObj.toISOString()

      const deleteImageIds = Array.from(removedImageIds).filter((id) => id > 0)

      const updateData: AuctionUpdateRequest = {
        title: data.title,
        description: data.description,
        startPrice: data.startPrice,
        bidStep: data.bidStep,
        endAt: endDateTimeISO,
      }
      if (deleteImageIds.length > 0) {
        updateData.deleteImageIds = deleteImageIds
      }
      if (mainImageId !== undefined && !removedImageIds.has(mainImageId)) {
        updateData.mainImageId = mainImageId
      } else if (mainIndex !== undefined && mainIndex < imageFiles.length) {
        updateData.mainIndex = mainIndex
      }

      const updatedAuction = await auctionApi.updateAuction(auctionId, imageFiles, updateData)

      toast.success("경매가 수정되었습니다!")
      router.push(`/auction/${auctionId}`)
    } catch (error) {
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
                    existingImageItems={existingImageItems}
                    onRemovedIdsChange={setRemovedImageIds}
                    enableMainImageSelection={true}
                    selectedMainImageId={mainImageId}
                    selectedMainIndex={mainIndex}
                    onMainImageChange={handleMainImageChange}
                  />
                  {imageFiles.length === 0 && existingImageItems.length === 0 && (
                    <p className="text-sm text-muted-foreground">경매 상품을 대표할 이미지를 업로드해주세요</p>
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
                  {/* 시작일 (읽기 전용) */}
                  <div className="space-y-2">
                    <Label htmlFor="startAt">경매 시작일</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={startDateTime}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">시작 시간은 수정할 수 없습니다</p>
                  </div>

                  {/* 종료일 (수정 가능) */}
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
