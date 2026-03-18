"use client"

import { useEffect, useState } from "react"
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

type FormState = {
  email: string
  username: string
  nickname: string
  phoneNumber: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [isBooting, setIsBooting] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [immutable, setImmutable] = useState<Pick<FormState, "email" | "username" | "phoneNumber">>({
    email: "",
    username: "",
    phoneNumber: "",
  })
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    nickname: "",
    phoneNumber: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const boot = async () => {
      try {
        const currentUser = await authApi.getCurrentUser()
        const email = currentUser.email ?? ""
        const username = currentUser.name ?? ""
        const phoneNumber = currentUser.phone ?? ""
        setImmutable({ email, username, phoneNumber })
        setForm((prev) => ({
          ...prev,
          email,
          username,
          nickname: currentUser.nickname ?? "",
          phoneNumber,
        }))
      } catch {
        setError("회원정보를 불러오지 못했습니다. 다시 로그인 후 시도해주세요.")
      } finally {
        setIsBooting(false)
      }
    }
    boot()
  }, [])

  const onChange = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!immutable.email || !immutable.username || !immutable.phoneNumber) {
      setError("회원정보를 불러오지 못했습니다. 다시 로그인 후 시도해주세요.")
      return
    }

    if (!form.nickname) {
      setError("닉네임을 입력해주세요")
      return
    }

    if (!form.newPassword || !form.confirmPassword) {
      setError("새 비밀번호를 입력해주세요")
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      return
    }
    if (form.newPassword.length < 6) {
      setError("비밀번호는 6자리 이상으로 설정해주세요")
      return
    }

    try {
      setIsSaving(true)
      await userApi.updateUserInfo({
        email: immutable.email,
        password: form.newPassword,
        username: immutable.username,
        nickname: form.nickname,
        phoneNumber: immutable.phoneNumber,
      })
      toast.success("회원정보가 수정되었습니다")
      router.replace("/")
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "회원정보 수정에 실패했습니다"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">회원정보 수정</CardTitle>
              <CardDescription>비밀번호 변경 및 기본 정보를 수정할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {isBooting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input id="email" type="email" value={form.email} disabled readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">이름(username)</Label>
                    <Input id="username" type="text" value={form.username} disabled readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input id="nickname" type="text" value={form.nickname} onChange={onChange("nickname")} disabled={isSaving} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">전화번호</Label>
                    <Input id="phoneNumber" type="tel" value={form.phoneNumber} disabled readOnly />
                  </div>

                  <div className="pt-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">새 비밀번호</Label>
                      <Input id="newPassword" type="password" value={form.newPassword} onChange={onChange("newPassword")} disabled={isSaving} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={onChange("confirmPassword")}
                        disabled={isSaving}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button type="button" variant="outline" disabled={isSaving} onClick={() => router.back()}>
                      취소
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        "저장"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}

