"use client"

import { useEffect, useState, Suspense } from "react"
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 provider, code, state 파라미터 추출
        const provider = searchParams.get("provider") as "google" | "kakao" | "naver" | null
        const code = searchParams.get("code")
        const state = searchParams.get("state")

        if (!provider || !code) {
          setError("OAuth 인증 정보가 없습니다")
          setIsLoading(false)
          return
        }

        // 백엔드로 코드를 전송하여 토큰으로 교환
        const response = await authApi.oauthCallback(provider, code, state || undefined)

        // 토큰 저장
        tokenStorage.setAccessToken(response.accessToken)
        if (response.refreshToken) {
          tokenStorage.setRefreshToken(response.refreshToken)
        }
        tokenStorage.setUser(response.user)

        // 사용자 정보 갱신
        await refreshUser()

        toast.success("로그인 성공!")
        router.push("/")
        router.refresh()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "OAuth 인증에 실패했습니다"
        setError(errorMessage)
        toast.error(errorMessage)
        setIsLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, router, refreshUser])

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
