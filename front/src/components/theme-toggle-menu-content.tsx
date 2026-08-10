"use client"

import { Check, Laptop, Moon, Sun } from "lucide-react"
import { DropdownMenuContent, DropdownMenuItem } from "@/src/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themeOptions = [
  { key: "light", label: "라이트", icon: Sun },
  { key: "dark", label: "다크", icon: Moon },
  { key: "system", label: "시스템", icon: Laptop },
] as const

type ThemeToggleMenuContentProps = {
  theme: string | undefined
  setTheme: (theme: string) => void
}

const ThemeToggleMenuContent = ({ theme, setTheme }: ThemeToggleMenuContentProps) => {
  return (
    <DropdownMenuContent align="end" className="w-36">
      {themeOptions.map(({ key, label, icon: Icon }) => {
        const isActive = theme === key
        return (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key)}
            className={cn("justify-between", isActive && "font-medium")}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </span>
            {isActive && <Check className="size-4" />}
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuContent>
  )
}

export default ThemeToggleMenuContent
