"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navigation } from "@/src/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { useAuth } from "@/src/contexts/auth-context"
import { authApi } from "@/src/services/api"
import { tokenStorage } from "@/src/lib/auth"
import { toast } from "sonner"

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasHandledRef = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      if (hasHandledRef.current) return
      hasHandledRef.current = true
      try {
        // URL에서 access_token 파라미터 추출
        const accessToken = searchParams.get("access_token")
        
        // OAuth 제공자에서 사용자 정보가 쿼리 파라미터로 전달되는 경우
        const userId = searchParams.get("user_id")
        const email = searchParams.get("email")
        const name = searchParams.get("name")
        const nickname = searchParams.get("nickname")
        const profileImageUrl = searchParams.get("profile_image_url")

        if (!accessToken) {
          // 토큰이 없으면 프로필 완성 페이지로 이동 (OAuth 성공했지만 토큰이 없는 경우)
          router.push("/auth/profile/complete")
          return
        }

        // 토큰 저장(메모리)
        tokenStorage.setAccessToken(accessToken)

        // 백엔드에서 실제 사용자 정보 조회
        try {
          const currentUser = await authApi.getCurrentUser()
          // 사용자 정보 갱신 (AuthContext 업데이트)
          await refreshUser()
          
          // 상태 업데이트를 위한 짧은 대기
          await new Promise(resolve => setTimeout(resolve, 200))

          // 프로필 완성 여부 확인 (이름, 닉네임, 전화번호 모두 있어야 함)
          if (!currentUser.name || !currentUser.nickname || !currentUser.phone) {
            // 프로필이 완성되지 않았으면 프로필 완성 페이지로 리다이렉트
            toast.info("추가 정보를 입력해주세요")
            router.push("/auth/profile/complete")
          } else {
            toast.success("로그인 성공!")
            router.push("/")
          }
        } catch {
          try {
            await refreshUser()
          } catch {
            // 갱신 실패 시 무시
          }
          toast.info("추가 정보를 입력해주세요")
          router.push("/auth/profile/complete")
        }

        router.refresh()
      } catch {
        // 에러 발생 시에도 프로필 완성 페이지로 이동
        toast.info("추가 정보를 입력해주세요")
        router.push("/auth/profile/complete")
      }
    }

    handleCallback()
  }, [router, refreshUser])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">OAuth 인증 처리 중</CardTitle>
            <CardDescription>잠시만 기다려주세요...</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">인증을 처리하고 있습니다...</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">OAuth 인증 처리 중</CardTitle>
                <CardDescription>잠시만 기다려주세요...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">인증을 처리하고 있습니다...</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  )
}
