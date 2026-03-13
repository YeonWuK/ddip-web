'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Navigation } from "@/src/components/navigation"
import { Button } from "@/src/components/ui/button"
import { Alert, AlertDescription } from "@/src/components/ui/alert"

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[ProjectDetailErrorBoundary]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              프로젝트 상세 페이지를 불러오는 중 문제가 발생했습니다.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/projects")}>
              목록으로 이동
            </Button>
            <Button onClick={reset}>
              <RotateCcw className="mr-2 size-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
