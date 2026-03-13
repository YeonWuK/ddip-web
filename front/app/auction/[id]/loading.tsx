import { Loader2 } from "lucide-react"
import { Navigation } from "@/src/components/navigation"

export default function AuctionDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">경매 정보를 불러오는 중...</p>
        </div>
      </main>
    </div>
  )
}
