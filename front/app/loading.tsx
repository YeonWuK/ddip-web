import { Loader2 } from "lucide-react"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">페이지를 불러오는 중...</p>
        </div>
      </main>
    </div>
  )
}
