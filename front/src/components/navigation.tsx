"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Menu,
  User,
  LogOut,
  Bell,
  Heart,
  House,
  TrendingUp,
  Sparkles,
  Rocket,
  Gavel,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/contexts/auth-context";
import { toast } from "sonner";

export function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search" className="flex items-center gap-2">
                <Search className="size-4" />검색
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="size-10" /> // 로딩 중 플레이스홀더
          ) : isAuthenticated ? (
            <>
              {/* 알림 아이콘 */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                <Badge className="absolute right-1 top-1 flex size-4 items-center justify-center p-0 text-[10px]">
                  3
                </Badge>
              </Button>

              {/* 찜 아이콘 */}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile?tab=favorites">
                  <Heart className="size-5" />
                </Link>
              </Button>

              {/* 프로필 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
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
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">마이페이지</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="md:hidden">
                <User className="size-5" />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2">
                  <House className="size-4" />홈
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/projects" className="flex items-center gap-2">
                  <Rocket className="size-4" />크라우드펀딩
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/auctions" className="flex items-center gap-2">
                  <Gavel className="size-4" />경매
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/search" className="flex items-center gap-2">
                  <Search className="size-4" />검색
                </Link>
              </DropdownMenuItem>
              {isAuthenticated ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="size-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile?tab=favorites"
                      className="flex items-center gap-2"
                    >
                      <Heart className="size-4" />
                      찜한 항목
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    로그아웃
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">로그인</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">회원가입</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
