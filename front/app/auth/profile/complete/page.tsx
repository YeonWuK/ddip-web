"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/src/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/src/contexts/auth-context";
import { authApi } from "@/src/services/api";
import { tokenStorage } from "@/src/lib/auth";
import { toast } from "sonner";

const USERNAME_REGEX = /^[가-힣]*$/;
const NICKNAME_REGEX = /^(?=.{2,15}$)(?!.*\.{2,})(?!.*\.$)[가-힣a-zA-Z0-9._-]+$/;
const PHONE_REGEX = /^\d{3}\d{3,4}\d{4}$/;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshUser, isAuthenticated, logout } = useAuth();
  const [formData, setFormData] = useState({
    username: "", // 백엔드 DTO: username
    nickname: "", // 백엔드 DTO: nickname
    phoneNumber: "", // 백엔드 DTO: phoneNumber
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 사용자 정보 로드 및 프로필 완성 여부 확인
  useEffect(() => {
    const checkProfile = async () => {
      try {
        // 토큰이 있으면 사용자 정보 조회 시도
        const token = tokenStorage.getAccessToken();
        if (token && !isAuthenticated) {
          // 토큰은 있지만 AuthContext가 업데이트되지 않았으면 refreshUser 호출
          try {
            await refreshUser();
            // refreshUser 후 잠시 대기하여 상태 업데이트 대기
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch {
          }
        }

        // 토큰이 있으면 사용자 정보 조회 시도
        if (token) {
          try {
            const currentUser = await authApi.getCurrentUser();
            setFormData({
              username: currentUser.name || "",
              nickname: currentUser.nickname || "",
              phoneNumber: currentUser.phone || "",
            });

            // 프로필이 이미 완성되었는지 확인
            if (currentUser.nickname && currentUser.phone && currentUser.name) {
              await refreshUser();
              router.push("/");
              return;
            }
          } catch {
            // 사용자 정보 조회 실패해도 프로필 입력은 가능하도록 함
          }
        } else if (user) {
          // 기존 사용자 정보로 폼 초기화
          setFormData({
            username: user.name || "",
            nickname: user.nickname || "",
            phoneNumber: user.phone || "",
          });

          // 프로필이 이미 완성되었는지 확인
          if (user.nickname && user.phone && user.name) {
            router.push("/");
            return;
          }
        } else if (!token) {
          // 토큰도 없고 사용자 정보도 없으면 로그인 페이지로 리다이렉트
          router.push("/login");
          return;
        }
      } catch {
        // 에러가 발생해도 프로필 입력은 가능하도록 함
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [user, isAuthenticated, router, refreshUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const username = formData.username.trim();
    const nickname = formData.nickname.trim();
    const phoneNumber = formData.phoneNumber.replace(/[^0-9]/g, "");

    if (!nickname || !phoneNumber || !username) {
      setError("필수 항목을 모두 입력해주세요");
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setError("이름은 한글만 사용 가능합니다.");
      return;
    }

    if (!NICKNAME_REGEX.test(nickname)) {
      setError("닉네임은 2~15자, 한글/영문/숫자와 . _ - 만 가능하며, 점(.)을 연속으로 쓰거나 마지막에 쓸 수 없습니다.");
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      setError("전화번호는 앞자리는 01이며, 중간 3~4자리, 세번째는 4자리인 전화번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.updateProfile({
        username, // 백엔드 DTO: username
        nickname, // 백엔드 DTO: nickname
        phoneNumber: phoneNumber, // 백엔드 DTO: phoneNumber (하이픈 제거한 숫자만 전송)
      });

      toast.success("프로필이 완성되었습니다! 다시 로그인해주세요.");
      
      // 프로필 완성 후 로그아웃 처리
      await logout();
      
      // 로그인 페이지로 리다이렉트 (확실한 리다이렉트를 위해 window.location 사용)
      window.location.href = "/login";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  프로필 정보를 확인하는 중...
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">프로필 완성</CardTitle>
            <CardDescription>
              서비스를 이용하기 위해 추가 정보를 입력해주세요
            </CardDescription>
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
                    // 숫자만 입력 허용
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: value,
                    }));
                  }}
                  disabled={isLoading}
                  required
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground">
                  숫자만 입력해주세요 (예: 01012345678)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "프로필 완성하기"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
