import { z } from "zod"

// 프로젝트 등록 스키마
export const projectCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 200자 이하여야 합니다"),
  description: z.string().min(1, "설명을 입력해주세요"),
  targetAmount: z.number().min(1, "목표 금액은 최소 1원 이상이어야 합니다"),
  startAt: z.string().min(1, "시작일을 선택해주세요").refine((val) => {
    if (!val) return false
    const date = new Date(val.includes("T") ? val : `${val}T00:00:00`)
    return !isNaN(date.getTime())
  }, "유효하지 않은 시작일입니다"),
  endAt: z.string().min(1, "종료일을 선택해주세요").refine((val) => {
    if (!val) return false
    const date = new Date(val.includes("T") ? val : `${val}T23:59:59`)
    return !isNaN(date.getTime())
  }, "유효하지 않은 종료일입니다"),
  rewardTiers: z
    .array(
      z.object({
        title: z.string().min(1, "리워드 제목을 입력해주세요").max(200, "리워드 제목은 200자 이하여야 합니다"),
        description: z.string().min(1, "리워드 설명을 입력해주세요"),
        price: z.number().min(1, "가격은 최소 1원 이상이어야 합니다"),
        limitQuantity: z.number().min(1).nullable().optional(),
      })
    )
    .min(1, "최소 1개 이상의 리워드를 추가해주세요"),
  categoryPath: z.string().max(100, "카테고리 경로는 100자 이하여야 합니다").optional().nullable(),
  tags: z.string().max(500, "태그는 500자 이하여야 합니다").optional().nullable(),
  summary: z.string().max(200, "요약은 200자 이하여야 합니다").optional().nullable(),
})

// 경매 등록 스키마
export const auctionCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하여야 합니다"),
  description: z.string().min(10, "설명은 최소 10자 이상이어야 합니다"),
  startPrice: z.number().min(1000, "시작가는 최소 1,000원 이상이어야 합니다"),
  bidStep: z.number().min(1000, "입찰 단위는 최소 1,000원 이상이어야 합니다"),
  buyoutPrice: z.number().min(1000).nullable().optional(),
  startAt: z.string().min(1, "시작일을 선택해주세요").refine((val) => {
    if (!val) return false
    const date = new Date(val)
    if (isNaN(date.getTime())) return false
    // 시작일은 현재 시간 이후여야 함
    return date > new Date()
  }, "경매 시작일은 현재 시간 이후여야 합니다"),
  endAt: z.string().min(1, "종료일을 선택해주세요").refine((val) => {
    if (!val) return false
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, "유효하지 않은 종료일입니다"),
}).refine((data) => {
  // 종료일은 시작일 이후여야 함
  const startDate = new Date(data.startAt)
  const endDate = new Date(data.endAt)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return true // 개별 검증에서 처리
  return endDate > startDate
}, {
  message: "종료일은 시작일 이후여야 합니다",
  path: ["endAt"], // endAt 필드에 에러 표시
})

export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>
export type AuctionCreateFormData = z.infer<typeof auctionCreateSchema>
