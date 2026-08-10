"use client"

import Link from "next/link"
import { LogOut, Settings } from "lucide-react"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"
import type { UserResponse } from "@/src/types/api"

type NavigationProfileMenuContentProps = {
  user: UserResponse | null
  onLogout: () => void
}

const NavigationProfileMenuContent = ({
  user,
  onLogout,
}: NavigationProfileMenuContentProps) => {
  return (
    <DropdownMenuContent align="end" className="w-48">
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium">{user?.nickname}</p>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/profile">마이페이지</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/profile/edit" className="flex items-center">
          <Settings className="mr-2 size-4" />
          회원정보 수정
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="mr-2 size-4" />
        로그아웃
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export default NavigationProfileMenuContent
