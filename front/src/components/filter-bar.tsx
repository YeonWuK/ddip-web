"use client"

import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"
import { useFilterStore, ProjectStatus, ProjectSort, AuctionStatus, AuctionSort } from "@/src/stores/filterStore"

interface FilterBarProps {
  type: 'project' | 'auction'
}

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'OPEN', label: '진행중' },
  { value: 'SUCCESS', label: '성공' },
  { value: 'FAILED', label: '실패' },
  { value: 'CANCELED', label: '취소됨' },
]

const projectSortOptions: { value: ProjectSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'ending', label: '마감임박순' },
  { value: 'amount', label: '모금액순' },
]

const auctionStatusOptions: { value: AuctionStatus; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SCHEDULED', label: '예정' },
  { value: 'RUNNING', label: '진행중' },
  { value: 'ENDED', label: '종료' },
  { value: 'CANCELED', label: '취소됨' },
]

const auctionSortOptions: { value: AuctionSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'price', label: '가격순' },
  { value: 'ending', label: '마감임박순' },
  { value: 'bidCount', label: '입찰수순' },
]

export function FilterBar({ type }: FilterBarProps) {
  if (type === 'project') {
    const { projectStatus, projectSort, setProjectStatus, setProjectSort, resetFilters } = useFilterStore()
    const hasActiveFilters = projectStatus !== 'ALL' || projectSort !== 'latest'
    
    return (
      <div className="flex items-center gap-2 mb-6">
        <Filter className="size-4 text-muted-foreground" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              상태: {projectStatusOptions.find(opt => opt.value === projectStatus)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>상태 필터</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projectStatusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setProjectStatus(option.value)}
                className={projectStatus === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              정렬: {projectSortOptions.find(opt => opt.value === projectSort)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projectSortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setProjectSort(option.value)}
                className={projectSort === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground"
          >
            <X className="size-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
    )
  }

  // 경매 필터
  const { auctionStatus, auctionSort, setAuctionStatus, setAuctionSort, resetFilters } = useFilterStore()
  const hasActiveFilters = auctionStatus !== 'ALL' || auctionSort !== 'latest'
  
  return (
    <div className="flex items-center gap-2 mb-6">
      <Filter className="size-4 text-muted-foreground" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            상태: {auctionStatusOptions.find(opt => opt.value === auctionStatus)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>상태 필터</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {auctionStatusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setAuctionStatus(option.value)}
              className={auctionStatus === option.value ? "bg-accent" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            정렬: {auctionSortOptions.find(opt => opt.value === auctionSort)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {auctionSortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setAuctionSort(option.value)}
              className={auctionSort === option.value ? "bg-accent" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-muted-foreground"
        >
          <X className="size-4 mr-1" />
          필터 초기화
        </Button>
      )}
    </div>
  )
}
