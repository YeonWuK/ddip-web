"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu-core"

const ThemeToggleMenuContent = dynamic(
  () => import("@/src/components/theme-toggle-menu-content"),
  { ssr: false }
)

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuLoaded, setMenuLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="테마 선택"
        className="text-muted-foreground"
      >
        <Sun className="size-4" />
      </Button>
    )
  }

  const CurrentIcon =
    theme === "system"
      ? resolvedTheme === "dark"
        ? Moon
        : Sun
      : theme === "dark"
        ? Moon
        : Sun

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setMenuLoaded(true)
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="테마 선택">
          <CurrentIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      {menuLoaded && (
        <ThemeToggleMenuContent theme={theme} setTheme={setTheme} />
      )}
    </DropdownMenu>
  )
}
