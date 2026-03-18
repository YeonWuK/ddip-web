"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/src/components/navigation"
import { ProtectedRoute } from "@/src/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { authApi, userApi } from "@/src/services/api"
import { toast } from "sonner"

export default function ChangePasswordPage() {
  const router = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || !confirmPassword) {
      setError("새 비밀번호를 입력해주세요")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      return
    }
    if (newPassword.length < 6) {
      setError("비밀번호는 6자리 이상으로 설정해주세요")
      return
    }

    try {
      setIsLoading(true)

      const currentUser = await authApi.getCurrentUser()
      const email = currentUser.email || ""
      const username = currentUser.name || ""
      const nickname = currentUser.nickname || ""
      const phoneNumber = currentUser.phone || ""

      if (!email || !username || !nickname || !phoneNumber) {
        throw new Error("회원정보를 불러오지 못했습니다. 다시 로그인 후 시도해주세요.")
      }

      await userApi.updateUserInfo({
        email,
        password: newPassword,
        username,
        nickname,
        phoneNumber,
      })

      toast.success("비밀번호가 변경되었습니다")
      router.replace("/")
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">비밀번호 변경</CardTitle>
              <CardDescription>임시 비밀번호로 로그인하셨습니다. 새 비밀번호를 설정해주세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => {
                      toast.info("다음에 비밀번호를 변경할 수 있습니다")
                      router.replace("/")
                      router.refresh()
                    }}
                  >
                    다음에 하기
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        변경 중...
                      </>
                    ) : (
                      "비밀번호 변경하기"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}

