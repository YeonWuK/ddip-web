/**
 * 권한 관리 유틸리티
 * DB role enum: ADMIN | USER
 */

import { UserResponse } from "@/src/types/api"
import { ProjectResponse, AuctionResponse } from "@/src/types/api"

/**
 * 관리자인지 확인 (role === 'ADMIN')
 */
export function isAdmin(user: UserResponse | null): boolean {
  return user?.role === 'ADMIN'
}

/**
 * 일반 사용자인지 확인 (role === 'USER' 또는 role 없음)
 */
export function isUser(user: UserResponse | null): boolean {
  return !user || user.role === 'USER' || !user.role
}

/**
 * 사용자가 프로젝트의 생성자인지 확인
 */
export function isProjectCreator(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!user || !project) return false
  
  // creatorId가 있으면 우선적으로 사용 (더 안전)
  if (project.creatorId !== undefined && project.creatorId !== null) {
    return project.creatorId === user.id
  }
  
  // creator 객체가 있으면 사용
  if (project.creator && project.creator.id !== undefined) {
    return project.creator.id === user.id
  }
  
  return false
}

/**
 * 사용자가 경매의 판매자인지 확인
 */
export function isAuctionSeller(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!user || !auction || !auction.seller) return false
  return auction.seller.id === user.id
}

/**
 * 사용자가 프로젝트를 수정할 수 있는지 확인
 * - 생성자만 수정 가능
 * - DRAFT 상태일 때만 수정 가능
 */
export function canEditProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!isProjectCreator(project, user)) return false
  // DRAFT 상태일 때만 수정 가능
  return project.status === "DRAFT"
}

/**
 * 사용자가 경매를 수정할 수 있는지 확인
 * - 판매자만 수정 가능
 * - SCHEDULED 상태일 때만 수정 가능
 */
export function canEditAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!isAuctionSeller(auction, user)) return false
  // SCHEDULED 상태일 때만 수정 가능
  return auction.status === "SCHEDULED"
}

/**
 * 사용자가 프로젝트를 취소할 수 있는지 확인
 * - 생성자만 취소 가능
 * - DRAFT 또는 OPEN 상태일 때만 취소 가능
 */
export function canCancelProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!isProjectCreator(project, user)) return false
  // DRAFT 또는 OPEN 상태일 때만 취소 가능
  return project.status === "DRAFT" || project.status === "OPEN"
}

/**
 * 사용자가 경매를 취소할 수 있는지 확인
 * - 판매자만 취소 가능
 * - SCHEDULED 또는 RUNNING 상태일 때만 취소 가능
 */
export function canCancelAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!isAuctionSeller(auction, user)) return false
  // SCHEDULED 또는 RUNNING 상태일 때만 취소 가능
  return auction.status === "SCHEDULED" || auction.status === "RUNNING"
}

/**
 * 어드민만 펀딩 오픈 가능 (DRAFT → OPEN 전환)
 */
export function canOpenFunding(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!user || !project) return false
  if (project.status !== "DRAFT") return false
  return isAdmin(user)
}

/**
 * 사용자가 프로젝트에 후원할 수 있는지 확인
 * - 로그인한 사용자만 가능
 * - 생성자는 자신의 프로젝트에 후원 불가
 * - OPEN 상태일 때만 가능
 */
export function canSupportProject(
  project: ProjectResponse,
  user: UserResponse | null
): boolean {
  if (!user) return false
  // 생성자는 자신의 프로젝트에 후원 불가
  if (isProjectCreator(project, user)) return false
  // OPEN 상태일 때만 후원 가능
  return project.status === "OPEN"
}

/**
 * 사용자가 경매에 입찰할 수 있는지 확인
 * - 로그인한 사용자만 가능
 * - 판매자는 자신의 경매에 입찰 불가
 * - RUNNING 상태일 때만 가능
 */
export function canBidAuction(
  auction: AuctionResponse,
  user: UserResponse | null
): boolean {
  if (!user) return false
  // 판매자는 자신의 경매에 입찰 불가
  if (isAuctionSeller(auction, user)) return false
  // RUNNING 상태일 때만 입찰 가능
  return auction.status === "RUNNING"
}

/**
 * 관리자 전용: 모든 프로젝트를 삭제할 수 있는지 확인
 * - 최고 관리자만 가능 (100 이상)
 */
export function canDeleteAnyProject(user: UserResponse | null): boolean {
  return isAdmin(user)
}

/**
 * 관리자 전용: 모든 경매를 삭제할 수 있는지 확인
 * - 최고 관리자만 가능 (100 이상)
 */
export function canDeleteAnyAuction(user: UserResponse | null): boolean {
  return isAdmin(user)
}

/**
 * 관리자 전용: 프로젝트 상태를 강제로 변경할 수 있는지 확인
 */
export function canForceUpdateProjectStatus(user: UserResponse | null): boolean {
  return isAdmin(user)
}

/**
 * 관리자 전용: 경매 상태를 강제로 변경할 수 있는지 확인
 */
export function canForceUpdateAuctionStatus(user: UserResponse | null): boolean {
  return isAdmin(user)
}

/**
 * 관리자 전용: 사용자 계정을 정지할 수 있는지 확인
 * - 최고 관리자만 가능 (100 이상)
 */
export function canSuspendUser(user: UserResponse | null): boolean {
  return isAdmin(user)
}

/**
 * 관리자 전용: 사용자 권한을 변경할 수 있는지 확인
 * - 최고 관리자만 가능 (100 이상)
 */
export function canChangeUserRole(user: UserResponse | null): boolean {
  return isAdmin(user)
}
