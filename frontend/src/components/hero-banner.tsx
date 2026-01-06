import { Button } from "@/src/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-primary px-4 py-16 text-primary-foreground md:py-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            당신의 아이디어를 현실로 만드세요
          </h1>
          <p className="mb-8 text-pretty text-lg text-primary-foreground/90 md:text-xl">
            크라우드펀딩으로 프로젝트를 시작하고, 경매로 특별한 제품을 만나보세요
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              프로젝트 둘러보기
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
            >
              경매 참여하기
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary-foreground/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary-foreground/5 blur-3xl" />
    </section>
  )
}
