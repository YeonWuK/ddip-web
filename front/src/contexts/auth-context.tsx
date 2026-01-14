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

  // 초기 로드 시 저장된 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken()
        const savedUser = tokenStorage.getUser()

        if (token) {
          // 토큰이 있으면 저장된 사용자 정보 사용
          if (savedUser) {
            setUser(savedUser)
          }
          
          // 백엔드에 /api/users/me가 있으면 사용자 정보 갱신 시도
          // 없으면 저장된 정보만 사용
          try {
            const currentUser = await authApi.getCurrentUser()
            setUser(currentUser)
            tokenStorage.setUser(currentUser)
          } catch (error) {
            // getCurrentUser 실패해도 토큰이 있으면 인증된 것으로 처리
            // (백엔드에 해당 엔드포인트가 없을 수 있음)
            console.warn("사용자 정보 조회 실패 (엔드포인트가 없을 수 있음):", error)
            // 저장된 사용자 정보가 있으면 그대로 사용
            if (savedUser) {
              setUser(savedUser)
            }
          }
        } else {
          // 토큰이 없으면 로그아웃 상태
          setUser(null)
        }
      } catch (error) {
        console.error("인증 초기화 실패:", error)
        // 에러 발생 시에도 토큰이 있으면 유지
        const token = tokenStorage.getAccessToken()
        if (!token) {
          tokenStorage.clearAll()
          setUser(null)
        }
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
      
      // 사용자 정보가 있으면 저장, 없어도 토큰만 있으면 로그인 성공
      if (response.user && response.user.id !== 0) {
        tokenStorage.setUser(response.user)
        setUser(response.user)
      } else {
        // 사용자 정보가 없으면 null로 설정 (토큰은 저장됨)
        setUser(null)
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      const response: AuthResponse = await authApi.register(data)
      
      tokenStorage.setAccessToken(response.accessToken)
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken)
      }
      
      // 사용자 정보가 있으면 저장, 없어도 토큰만 있으면 회원가입 성공
      if (response.user && response.user.id !== 0) {
        tokenStorage.setUser(response.user)
        setUser(response.user)
      } else {
        // 사용자 정보가 없으면 null로 설정 (토큰은 저장됨)
        setUser(null)
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("로그아웃 실패:", error)
    } finally {
      tokenStorage.clearAll()
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      tokenStorage.setUser(currentUser)
    } catch (error) {
      console.error("사용자 정보 갱신 실패:", error)
      // getCurrentUser 실패해도 토큰이 있으면 로그아웃하지 않음
      // (백엔드에 해당 엔드포인트가 없을 수 있음)
      const token = tokenStorage.getAccessToken()
      if (!token) {
        // 토큰이 없으면 로그아웃 처리
        tokenStorage.clearAll()
        setUser(null)
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
      console.error("OAuth 로그인 실패:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    // 토큰이 있으면 인증된 것으로 처리 (사용자 정보가 없어도)
    isAuthenticated: !!tokenStorage.getAccessToken(),
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
