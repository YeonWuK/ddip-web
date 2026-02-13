"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/src/components/ui/button"
import { X, Upload, GripVertical } from "lucide-react"

interface MultiImageUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  maxImages?: number
  className?: string
  /** 기존 이미지 URL 배열 (레거시) */
  existingImages?: string[]
  /** 제거된 기존 이미지 인덱스 (existingImages 사용 시) */
  onExistingImagesChange?: (removedIndices: Set<number>) => void
  /** 기존 이미지 id+url (Edit 시 X 버튼 → imageIds 전송용) */
  existingImageItems?: { id: number; url: string }[]
  /** 제거된 기존 이미지 id (existingImageItems 사용 시) */
  onRemovedIdsChange?: (removedIds: Set<number>) => void
}

export function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 3,
  className,
  existingImages = [],
  onExistingImagesChange,
  existingImageItems,
  onRemovedIdsChange,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<File[]>(value)
  const [removedExistingIndices, setRemovedExistingIndices] = useState<Set<number>>(new Set())
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const useImageItems = existingImageItems && existingImageItems.length > 0
  const visibleExistingItems = useImageItems
    ? existingImageItems.filter((item) => !removedImageIds.has(item.id))
    : existingImages
        .map((url, index) => ({ url, index }))
        .filter(({ index }) => !removedExistingIndices.has(index))
  const visibleExistingImages = visibleExistingItems.map((x: { url: string }) => x.url)

  useEffect(() => {
    if (!useImageItems) onExistingImagesChange?.(removedExistingIndices)
  }, [useImageItems, removedExistingIndices, onExistingImagesChange])

  useEffect(() => {
    if (useImageItems) onRemovedIdsChange?.(removedImageIds)
  }, [useImageItems, removedImageIds, onRemovedIdsChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      alert("이미지 파일만 업로드 가능합니다")
      return
    }

    const totalImages = images.length + visibleExistingImages.length
    const remainingSlots = maxImages - totalImages
    if (imageFiles.length > remainingSlots) {
      alert(`최대 ${maxImages}장까지 업로드 가능합니다. ${remainingSlots}장만 추가됩니다.`)
      imageFiles.splice(remainingSlots)
    }

    const newImages = [...images, ...imageFiles]
    setImages(newImages)
    onChange?.(newImages)

    // input 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onChange?.(newImages)
  }

  const handleRemoveExisting = (itemOrIndex: { id: number; url: string } | number) => {
    if (useImageItems && typeof itemOrIndex !== 'number') {
      setRemovedImageIds((prev) => new Set([...prev, itemOrIndex.id]))
    } else if (!useImageItems && typeof itemOrIndex === 'number') {
      setRemovedExistingIndices((prev) => new Set([...prev, itemOrIndex]))
    }
  }

  const handleAddMore = () => {
    fileInputRef.current?.click()
  }

  const totalDisplayImages = images.length + visibleExistingImages.length

  return (
    <div className={className}>
      {totalDisplayImages === 0 ? (
        // 이미지가 없을 때: 큰 업로드 영역만 표시
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted">
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">이미지를 업로드하세요 (최대 {maxImages}장)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMore}
            >
              파일 선택
            </Button>
          </div>
        </div>
      ) : (
        // 이미지가 있을 때: 그리드 레이아웃으로 표시
        <div className="grid grid-cols-3 gap-4">
          {/* 기존 이미지 표시 */}
          {visibleExistingItems.map((item, index) => {
            const imageUrl = 'url' in item ? item.url : (item as { url: string }).url
            const key = useImageItems ? `existing-${(item as { id: number }).id}` : `existing-${(item as { index: number }).index}`
            return (
              <div
                key={key}
                className="group relative aspect-video overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={imageUrl}
                  alt={`기존 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    useImageItems
                      ? handleRemoveExisting(item as { id: number; url: string })
                      : handleRemoveExisting((item as { index: number }).index)
                  }
                >
                  <X className="size-4" />
                </Button>
                <div className="absolute left-2 top-2 rounded bg-blue-500/80 px-2 py-1 text-xs text-white">
                  기존
                </div>
              </div>
            )
          })}

          {/* 새로 업로드한 이미지 */}
          {images.map((image, index) => {
            const previewUrl = URL.createObjectURL(image)
            return (
              <div
                key={`new-${index}`}
                className="group relative aspect-video overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={previewUrl}
                  alt={`새 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemove(index)}
                >
                  <X className="size-4" />
                </Button>
                <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {visibleExistingImages.length + index + 1}
                </div>
              </div>
            )
          })}

          {totalDisplayImages < maxImages && (
            <div
              className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed bg-muted transition-colors hover:bg-muted/80"
              onClick={handleAddMore}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  이미지 추가 ({totalDisplayImages}/{maxImages})
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
