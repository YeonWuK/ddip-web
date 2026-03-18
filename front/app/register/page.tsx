"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/src/contexts/auth-context"
import { toast } from "sonner"
import { Separator } from "@/src/components/ui/separator"
import { BankType } from "@/src/types/api"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[a-z])(?=.*\W)(?=\S+$).{8,16}$/
const USERNAME_REGEX = /^[가-힣]*$/
const NICKNAME_REGEX = /^(?=.{2,15}$)(?!.*\.{2,})[가-힣a-zA-Z0-9._-]+(?<!\.)$/
const PHONE_REGEX = /^\d{3}\d{3,4}\d{4}$/

export default function RegisterPage() {
  const router = useRouter()
  const { register, oauthLogin } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    nickname: "",
    phoneNumber: "",
    account: "",
    accountHolder: "",
    bankType: "" as string | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const email = formData.email.trim()
    const password = formData.password
    const username = formData.username.trim()
    const nickname = formData.nickname.trim()
    const phoneNumber = formData.phoneNumber.replace(/[^0-9]/g, "")

    // 유효성 검사
    if (!email || !password || !username || !nickname || !phoneNumber) {
      setError("필수 항목을 모두 입력해주세요")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("이메일 형식이 올바르지 않습니다.")
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError("비밀번호는 8~16자 영문 소문자, 숫자, 특수문자를 사용하세요.")
      return
    }

    if (!USERNAME_REGEX.test(username)) {
      setError("이름은 한글만 사용 가능합니다.")
      return
    }

    if (!NICKNAME_REGEX.test(nickname)) {
      setError("닉네임은 2~15자, 한글/영문/숫자와 . _ - 만 가능하며, 점(.)을 연속으로 쓰거나 마지막에 쓸 수 없습니다.")
      return
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      setError("전화번호는 앞자리는 01이며, 중간 3~4자리, 세번째는 4자리인 전화번호를 입력해주세요.")
      return
    }

    try {
      setIsLoading(true)
      await register({
        email,
        password,
        username,
        nickname,
        phoneNumber,
        account: formData.account || null,
        accountHolder: formData.accountHolder || null,
        bankType: formData.bankType && formData.bankType !== '' ? (formData.bankType as BankType) : undefined,
      })
      toast.success("회원가입 성공!")
      router.push("/")
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "회원가입에 실패했습니다"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      setIsOAuthLoading(provider)
      await oauthLogin(provider)
      // oauthLogin은 리다이렉트를 수행하므로 여기까지 도달하지 않음
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "OAuth 로그인에 실패했습니다"
      setError(errorMessage)
      toast.error(errorMessage)
      setIsOAuthLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
            <CardDescription>새로운 계정을 만들어보세요</CardDescription>
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
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="8~16자 (소문자/숫자/특수문자 포함)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">이름 *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="홍길동"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임 *</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="닉네임"
                  value={formData.nickname}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호 *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="01012345678"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    setFormData((prev) => ({ ...prev, phoneNumber: value }))
                  }}
                  disabled={isLoading}
                  required
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankType">은행</Label>
                <select
                  id="bankType"
                  name="bankType"
                  value={formData.bankType || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankType: e.target.value || null }))}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">선택 안함</option>
                  <option value="KB">KB국민은행</option>
                  <option value="SHINHAN">신한은행</option>
                  <option value="WOORI">우리은행</option>
                  <option value="HANA">하나은행</option>
                  <option value="NH">NH농협은행</option>
                  <option value="IBK">IBK기업은행</option>
                  <option value="KAKAO">카카오뱅크</option>
                  <option value="TOSS">토스뱅크</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">계좌번호</Label>
                <Input
                  id="account"
                  name="account"
                  type="text"
                  placeholder="계좌번호"
                  value={formData.account}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">예금주</Label>
                <Input
                  id="accountHolder"
                  name="accountHolder"
                  type="text"
                  placeholder="예금주명"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    회원가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  로그인
                </Link>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || isOAuthLoading !== null}
                  onClick={() => handleOAuthLogin('google')}
                >
                  {isOAuthLoading === 'google' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="size-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-[#FEE500]"
                  disabled={isLoading || isOAuthLoading !== null}
                  onClick={() => handleOAuthLogin('kakao')}
                >
                  {isOAuthLoading === 'kakao' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                      </svg>
                      Kakao
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#03C75A] hover:bg-[#03C75A]/90 text-white border-[#03C75A]"
                  disabled={isLoading || isOAuthLoading !== null}
                  onClick={() => handleOAuthLogin('naver')}
                >
                  {isOAuthLoading === 'naver' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                      </svg>
                      Naver
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
