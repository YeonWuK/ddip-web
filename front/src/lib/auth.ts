// 토큰 저장/관리 유틸리티

import { UserResponse } from '@/src/types/api'

const ACCESS_TOKEN_KEY = 'ddip_access_token'
const REFRESH_TOKEN_KEY = 'ddip_refresh_token'
const USER_KEY = 'ddip_user'

export const tokenStorage = {
  // Access Token
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  removeAccessToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  // Refresh Token
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  removeRefreshToken: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // User
  getUser: (): UserResponse | null => {
    if (typeof window === 'undefined') return null
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? (JSON.parse(userStr) as UserResponse) : null
    } catch (error) {
      console.error('사용자 정보 파싱 실패:', error)
      return null
    }
  },

  setUser: (user: UserResponse): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error)
    }
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(USER_KEY)
  },

  // 전체 삭제 (로그아웃 시)
  clearAll: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
