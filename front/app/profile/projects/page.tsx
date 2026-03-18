"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/src/components/navigation"
import { ProtectedRoute } from "@/src/components/protected-route"
import { Card } from "@/src/components/ui/card"
import { projectApi } from "@/src/services/api"
import { useAuth } from "@/src/contexts/auth-context"
import { ProjectResponse } from "@/src/types/api"
import { toast } from "sonner"

export default function MyProjectsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadProjects()
    }
  }, [authLoading, isAuthenticated, user?.id])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const allProjects = await projectApi.getProjects()
      const userId = user?.id
      if (!userId) {
        setProjects([])
        return
      }
      setProjects(allProjects.filter((p) => p.creator.id === userId))
    } catch {
      toast.error("내 프로젝트를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.id - a.id),
    [projects]
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Navigation />
        <main className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">내 프로젝트 전체</h1>
              <p className="text-sm text-muted-foreground">내가 등록한 프로젝트 {sortedProjects.length}개</p>
            </div>
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-primary">
              마이페이지로 돌아가기
            </Link>
          </div>

          {authLoading || loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : sortedProjects.length === 0 ? (
            <Card className="border-none p-10 text-center text-sm text-muted-foreground shadow-sm">
              등록된 프로젝트가 없습니다.
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedProjects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <Card className="border-none p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={project.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold">{project.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.currentAmount.toLocaleString()}원 / {project.targetAmount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
