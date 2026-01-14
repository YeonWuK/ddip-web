import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectResponse, AuctionResponse } from '@/src/types/api'

// 프로젝트 필터 타입
export type ProjectStatus = 'ALL' | 'OPEN' | 'SUCCESS' | 'FAILED' | 'CANCELED'
export type ProjectSort = 'latest' | 'popular' | 'ending' | 'amount'

// 경매 필터 타입
export type AuctionStatus = 'ALL' | 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELED'
export type AuctionSort = 'latest' | 'price' | 'ending' | 'bidCount'

interface FilterState {
  // 프로젝트 필터
  projectStatus: ProjectStatus
  projectSort: ProjectSort
  
  // 경매 필터
  auctionStatus: AuctionStatus
  auctionSort: AuctionSort
  
  // 액션
  setProjectStatus: (status: ProjectStatus) => void
  setProjectSort: (sort: ProjectSort) => void
  setAuctionStatus: (status: AuctionStatus) => void
  setAuctionSort: (sort: AuctionSort) => void
  resetFilters: () => void
}

const initialState = {
  projectStatus: 'ALL' as ProjectStatus,
  projectSort: 'latest' as ProjectSort,
  auctionStatus: 'ALL' as AuctionStatus,
  auctionSort: 'latest' as AuctionSort,
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setProjectStatus: (status) => set({ projectStatus: status }),
      setProjectSort: (sort) => set({ projectSort: sort }),
      setAuctionStatus: (status) => set({ auctionStatus: status }),
      setAuctionSort: (sort) => set({ auctionSort: sort }),
      resetFilters: () => set(initialState),
    }),
    {
      name: 'ddip-filters', // localStorage 키
    }
  )
)

// 필터링 및 정렬 유틸리티 함수
export const filterAndSortProjects = (
  projects: ProjectResponse[],
  status: ProjectStatus,
  sort: ProjectSort
): ProjectResponse[] => {
  // 상태 필터링
  let filtered = projects
  if (status !== 'ALL') {
    filtered = projects.filter(project => project.status === status)
  }
  
  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'latest':
        return b.id - a.id // ID가 타임스탬프이므로 큰 순서대로
      case 'popular':
        // 후원자 수 기준
        const backersA = a.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
        const backersB = b.rewardTiers.reduce((sum, tier) => sum + tier.soldQuantity, 0)
        return backersB - backersA
      case 'ending':
        // 마감 임박순
        const endTimeA = new Date(a.endAt).getTime()
        const endTimeB = new Date(b.endAt).getTime()
        return endTimeA - endTimeB
      case 'amount':
        // 모금액 순
        return b.currentAmount - a.currentAmount
      default:
        return 0
    }
  })
  
  return sorted
}

export const filterAndSortAuctions = (
  auctions: AuctionResponse[],
  status: AuctionStatus,
  sort: AuctionSort
): AuctionResponse[] => {
  // 상태 필터링
  let filtered = auctions
  if (status !== 'ALL') {
    filtered = auctions.filter(auction => auction.status === status)
  }
  
  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'latest':
        return b.id - a.id // ID가 타임스탬프이므로 큰 순서대로
      case 'price':
        // 현재가 순
        return b.currentPrice - a.currentPrice
      case 'ending':
        // 마감 임박순
        const endTimeA = new Date(a.endAt).getTime()
        const endTimeB = new Date(b.endAt).getTime()
        return endTimeA - endTimeB
      case 'bidCount':
        // 입찰 횟수 순 (현재는 0이므로 ID 순으로 대체)
        return b.id - a.id
      default:
        return 0
    }
  })
  
  return sorted
}
