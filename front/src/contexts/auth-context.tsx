"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { UserResponse, AuthResponse, RegisterRequest } from "@/src/types/api"
import { authApi } from "@/src/services/api"
import { tokenStorage } from "@/src/lib/auth"

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  oauthLogin: (provider: 'google' | 'kakao' | 'naver') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 초기 로드 시 저장된 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken()

        if (token) {
          setIsAuthenticated(true)
          
          // 백엔드에서 최신 사용자 정보를 가져오기 시도
          try {
            const currentUser = await authApi.getCurrentUser()
            setUser(currentUser)
            tokenStorage.setUser(currentUser)
          } catch {
            const savedUser = tokenStorage.getUser()
            if (savedUser && savedUser.id !== 0) {
              setUser(savedUser)
            } else {
              // 사용자 정보가 없으면 null로 설정 (토큰은 유지)
              setUser(null)
            }
          }
        } else {
          // 토큰이 없으면 로그아웃 상태
          tokenStorage.clearAll()
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch {
        // 에러 발생 시 모든 정보 삭제
        tokenStorage.clearAll()
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password })
      
      tokenStorage.setAccessToken(response.accessToken)
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken)
      }
      setIsAuthenticated(true)
      
      // 이전 사용자 정보 삭제 (새로운 로그인 전에)
      tokenStorage.removeUser()
      
      // 로그인 응답에 사용자 정보가 있으면 사용
      if (response.user && response.user.id !== 0) {
        tokenStorage.setUser(response.user)
        setUser(response.user)
      } else {
        // 로그인 응답에 사용자 정보가 없으면 백엔드에서 가져오기 시도
        try {
          // 토큰이 저장된 후 약간의 지연을 두고 호출 (백엔드 토큰 검증 대기)
          await new Promise(resolve => setTimeout(resolve, 300)) // 300ms 지연
          const currentUser = await authApi.getCurrentUser()
          tokenStorage.setUser(currentUser)
          setUser(currentUser)
        } catch {
          setUser(null)
          tokenStorage.removeUser()
        }
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      // OAuth와 동일하게 기존 세션 정리 (로그아웃)
      tokenStorage.clearAll()
      setIsAuthenticated(false)
      setUser(null)
      
      // 회원가입 후 자동 로그인
      const response: AuthResponse = await authApi.register(data)
      
      tokenStorage.setAccessToken(response.accessToken)
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken)
      }
      setIsAuthenticated(true)
      
      // 로그인 응답에 사용자 정보가 있으면 사용
      if (response.user && response.user.id !== 0) {
        tokenStorage.setUser(response.user)
        setUser(response.user)
      } else {
        // 로그인 응답에 사용자 정보가 없으면 백엔드에서 가져오기 시도
        try {
          // 토큰이 저장된 후 약간의 지연을 두고 호출 (백엔드 토큰 검증 대기)
          await new Promise(resolve => setTimeout(resolve, 300)) // 300ms 지연
          const currentUser = await authApi.getCurrentUser()
          tokenStorage.setUser(currentUser)
          setUser(currentUser)
        } catch {
          setUser(null)
          tokenStorage.removeUser()
        }
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // 로그아웃 API 실패해도 클라이언트 상태는 정리
    } finally {
      tokenStorage.clearAll()
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      tokenStorage.setUser(currentUser)
      setIsAuthenticated(true)
    } catch {
      // getCurrentUser 실패해도 토큰이 있으면 로그아웃하지 않음
      // (백엔드에 해당 엔드포인트가 없을 수 있음)
      const token = tokenStorage.getAccessToken()
      if (!token) {
        // 토큰이 없으면 로그아웃 처리
        tokenStorage.clearAll()
        setIsAuthenticated(false)
        setUser(null)
      } else {
        setIsAuthenticated(true)
      }
    }
  }

  const oauthLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      // OAuth 로그인 URL 가져오기
      const redirectUrl = await authApi.oauthLogin(provider)
      
      // 백엔드 OAuth 엔드포인트로 리다이렉트
      // 백엔드에서 OAuth 제공자 페이지로 리다이렉트하고,
      // 인증 후 콜백 URL로 돌아옴
      window.location.href = redirectUrl
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    oauthLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
