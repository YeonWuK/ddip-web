"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Menu,
  User,
  Bell,
  Heart,
  House,
  Rocket,
  Gavel,
  Shield,
  Coins,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu-core";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/contexts/auth-context";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { toast } from "sonner";

const NavigationProfileMenuContent = dynamic(
  () => import("@/src/components/navigation-profile-menu-content"),
  { ssr: false }
);

const NavigationMobileMenuContent = dynamic(
  () => import("@/src/components/navigation-mobile-menu-content"),
  { ssr: false }
);

export function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [profileMenuLoaded, setProfileMenuLoaded] = useState(false);
  const [mobileMenuLoaded, setMobileMenuLoaded] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃되었습니다");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("로그아웃에 실패했습니다");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                D
              </span>
            </div>
            <span className="text-xl font-bold">DDIP</span>
          </Link>

          {/* 데스크톱 네비게이션 링크 */}
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <House className="size-4" />홈
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects" className="flex items-center gap-2">
                <Rocket className="size-4" />크라우드펀딩
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auctions" className="flex items-center gap-2">
                <Gavel className="size-4" />경매
              </Link>
            </Button>
            {/* ADMIN 전용 관리자 링크 */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin" className="flex items-center gap-2 text-orange-600 hover:text-orange-700">
                  <Shield className="size-4" />관리자
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <div className="size-10" /> // 로딩 중 플레이스홀더
          ) : isAuthenticated ? (
            <>
              {/* 포인트 잔액 */}
              {user?.pointBalance !== undefined && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <Coins className="size-4 shrink-0" />
                  <span className="tabular-nums">
                    {(user?.pointBalance ?? 0).toLocaleString()}
                  </span>
                  <span className="text-primary/80">P</span>
                </div>
              )}
              {/* 알림 아이콘 */}
              <Button variant="ghost" size="icon" className="relative" aria-label="알림">
                <Bell className="size-5" />
                <Badge className="absolute right-1 top-1 flex size-4 items-center justify-center p-0 text-[10px]">
                  3
                </Badge>
              </Button>

              {/* 찜 아이콘 */}
              <Button variant="ghost" size="icon" asChild aria-label="찜한 항목">
                <Link href="/profile?tab=favorites">
                  <Heart className="size-5" />
                </Link>
              </Button>

              {/* 프로필 드롭다운 */}
              <DropdownMenu
                onOpenChange={(open) => {
                  if (open) setProfileMenuLoaded(true);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="프로필 메뉴">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user?.profileImageUrl || undefined}
                        alt={user?.nickname || ""}
                      />
                      <AvatarFallback>
                        {user?.nickname?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {profileMenuLoaded && (
                  <NavigationProfileMenuContent user={user} onLogout={handleLogout} />
                )}
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="md:hidden" asChild aria-label="로그인">
                <Link href="/login">
                  <User className="size-5" />
                </Link>
              </Button>
              <Button variant="ghost" className="hidden md:inline-flex" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button className="hidden md:inline-flex" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}

          {/* 모바일 메뉴 */}
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) setMobileMenuLoaded(true);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            {mobileMenuLoaded && (
              <NavigationMobileMenuContent
                isAuthenticated={isAuthenticated}
                user={user}
                onLogout={handleLogout}
              />
            )}
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
