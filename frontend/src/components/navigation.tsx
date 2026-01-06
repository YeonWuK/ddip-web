import Link from "next/link"
import { Button } from "@/src/components/ui/button"
import { Menu, Search, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { Input } from "@/src/components/ui/input"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">F</span>
            </div>
            <span className="text-xl font-bold">FundIt</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              프로젝트
            </Link>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              경매
            </Link>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              둘러보기
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="프로젝트 검색..." className="w-[240px] pl-10" />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="size-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <User className="size-5" />
          </Button>

          <Button className="hidden md:inline-flex">프로젝트 시작하기</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>프로젝트</DropdownMenuItem>
              <DropdownMenuItem>경매</DropdownMenuItem>
              <DropdownMenuItem>둘러보기</DropdownMenuItem>
              <DropdownMenuItem>프로젝트 시작하기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
