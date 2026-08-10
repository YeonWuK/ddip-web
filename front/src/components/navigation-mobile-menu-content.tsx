"use client"

import Link from "next/link"
import { User, Heart, House, Rocket, Gavel, Shield, Settings } from "lucide-react"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"
import type { UserResponse } from "@/src/types/api"

type NavigationMobileMenuContentProps = {
  isAuthenticated: boolean
  user: UserResponse | null
  onLogout: () => void
}

const NavigationMobileMenuContent = ({
  isAuthenticated,
  user,
  onLogout,
}: NavigationMobileMenuContentProps) => {
  return (
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
      {isAuthenticated ? (
        <>
          <DropdownMenuSeparator />
          {user?.role === "ADMIN" && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 text-orange-600">
                <Shield className="size-4" />
                관리자
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="size-4" />
              마이페이지
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit" className="flex items-center gap-2">
              <Settings className="size-4" />
              회원정보 수정
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile?tab=favorites" className="flex items-center gap-2">
              <Heart className="size-4" />
              찜한 항목
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout}>로그아웃</DropdownMenuItem>
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
  )
}

export default NavigationMobileMenuContent
