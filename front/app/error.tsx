'use client'

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Alert, AlertDescription } from "@/src/components/ui/alert"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalErrorBoundary]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              페이지를 렌더링하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
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
