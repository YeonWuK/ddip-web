"use client"

import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const iconElement = <Icon className="mx-auto size-12 text-muted-foreground mb-4" />
  
  const actionElement = action && (
    <div className="mt-4">
      {action.href ? (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : action.onClick ? (
        <Button onClick={action.onClick}>{action.label}</Button>
      ) : null}
    </div>
  )

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          {iconElement}
          <p className="text-lg font-semibold mb-2">{title}</p>
          {description && (
            <p className="text-muted-foreground mb-4">{description}</p>
          )}
          {actionElement}
        </div>
      </CardContent>
    </Card>
  )
}
