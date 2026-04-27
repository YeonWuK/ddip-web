"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { Check, ChevronLeft, ChevronRight, Circle, Flame, Gem, Headphones, Keyboard, Droplets, Apple } from "lucide-react"

type Step = 1 | 2 | 3 | 4
type TimingAnswer = "urgent" | "week" | "any"
type CategoryAnswer = "tech" | "fashion" | "home" | "beauty"
type BudgetAnswer = "low" | "mid" | "high"
type Persona = "FAST" | "STABLE"

const timingOptions: Array<{ id: TimingAnswer; title: string; desc: string; icon: string }> = [
  { id: "urgent", title: "1~3일 이내 마감", desc: "희소성과 긴장감 있는 펀딩을 즐겨요", icon: "⚡" },
  { id: "week", title: "1주일 내외", desc: "여유 있게 고민하고 결정하고 싶어요", icon: "🗓️" },
  { id: "any", title: "상관없어요", desc: "좋은 상품이면 마감 기간은 따지지 않아요", icon: "🔎" },
]

const categoryOptions: Array<{ id: CategoryAnswer; title: string; desc: string; icon: string }> = [
  { id: "tech", title: "전자기기 · 가전", desc: "이어폰, 스피커, 가젯류", icon: "🎧" },
  { id: "fashion", title: "패션 · 잡화", desc: "의류, 가방, 시계, 액세서리", icon: "👗" },
  { id: "home", title: "생활 · 주방", desc: "인테리어, 주방용품, 홈케어", icon: "🧹" },
  { id: "beauty", title: "건강 · 뷰티", desc: "스킨케어, 건강식품, 피트니스", icon: "🌿" },
]

const budgetOptions: Array<{ id: BudgetAnswer; title: string; desc: string; icon: string }> = [
  { id: "low", title: "3만원 미만", desc: "소소하게 자주 참여하는 편이에요", icon: "💰" },
  { id: "mid", title: "3만원 ~ 10만원", desc: "가성비 좋은 중가 상품을 좋아해요", icon: "💳" },
  { id: "high", title: "10만원 이상", desc: "품질이 좋다면 아끼지 않아요", icon: "💎" },
]

function getPersona(timing: TimingAnswer, budget: BudgetAnswer): Persona {
  if (timing === "urgent") return "FAST"
  if (timing === "week") return "STABLE"
  return budget === "high" ? "STABLE" : "FAST"
}

export default function MockPage() {
  const [step, setStep] = useState<Step>(1)
  const [timing, setTiming] = useState<TimingAnswer>("urgent")
  const [category, setCategory] = useState<CategoryAnswer[]>([])
  const [budget, setBudget] = useState<BudgetAnswer>("mid")

  const persona = useMemo(() => getPersona(timing, budget), [timing, budget])

  const personaTitle = persona === "FAST" ? "빠른 참여형" : "안정 참여형"
  const personaDesc =
    persona === "FAST"
      ? "마감 임박 상품을 빠르게 캐치하는 스타일이에요."
      : "달성률과 흐름을 확인한 뒤 안정적으로 참여하는 스타일이에요."

  const resultTags =
    persona === "FAST"
      ? ["마감 임박 우선", "전자기기 선호", "중가 가격대", "참여 증가 민감"]
      : ["안정성 우선", "후원 흐름 확인", "달성률 중시", "신중한 참여"]

  const resultProjects =
    persona === "FAST"
      ? [
          { title: "무선 이어폰 공동구매", subtitle: "마감 임박 · 참여 증가 빠름", rate: "72%", left: "1일 남음", badge: "지금 추천", badgeColor: "bg-[#ff6b6b]/15 text-[#ff8a8a]", rateColor: "text-[#ff8a8a]", iconBg: "bg-[#2d6bff]/15", icon: "headphones" as const },
          { title: "한정판 키보드 공동구매", subtitle: "인기 옵션 소진 임박", rate: "65%", left: "2일 남음", badge: "타이밍 중요", badgeColor: "bg-[#f59e0b]/15 text-[#fbbf24]", rateColor: "text-[#fbbf24]", iconBg: "bg-[#f59e0b]/15", icon: "keyboard" as const },
        ]
      : [
          { title: "친환경 세제 공동구매", subtitle: "후원 흐름 안정적", rate: "91%", left: "5일 남음", badge: "안정 참여", badgeColor: "bg-[#22c55e]/15 text-[#4ade80]", rateColor: "text-[#4ade80]", iconBg: "bg-[#22c55e]/15", icon: "droplets" as const },
          { title: "지역 농가 상생 과일 공동구매", subtitle: "달성률 기반 신뢰 구간", rate: "88%", left: "4일 남음", badge: "신중 추천", badgeColor: "bg-[#a78bfa]/15 text-[#c4b5fd]", rateColor: "text-[#c4b5fd]", iconBg: "bg-[#a78bfa]/15", icon: "apple" as const },
        ]

  const canNext =
    (step === 1 && !!timing) ||
    (step === 2 && category.length > 0) ||
    (step === 3 && !!budget)

  return (
    <div className="min-h-screen bg-[#17191d] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[680px]">
        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map((n) => {
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-3">
                <div
                  className={[
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition",
                    done
                      ? "border-[#2d6bff] bg-[#2d6bff] text-white"
                      : active
                        ? "border-[#7aa2ff] bg-[#2d6bff] text-white"
                        : "border-white/25 text-white/50",
                  ].join(" ")}
                >
                  {done ? <Check className="size-4" /> : n}
                </div>
                {n < 3 && <div className="h-px w-8 bg-white/25" />}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <Card className="border-white/15 bg-[#1d2025] text-white">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm text-white/60">질문 1 / 3</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-snug md:text-3xl">마감이 얼마나 임박한 상품을 선호하시나요?</h1>
                <p className="mt-2 text-white/70">선택에 따라 타이밍 알림 빈도가 달라져요.</p>
              </div>
              <div className="space-y-3">
                {timingOptions.map((o) => {
                  const selected = timing === o.id
                  return (
                    <button
                      key={o.id}
                      onClick={() => setTiming(o.id)}
                      className={[
                        "w-full rounded-2xl border px-4 py-4 text-left transition",
                        selected ? "border-[#2d6bff] bg-[#262a31] text-white" : "border-white/15 bg-[#262a31] text-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-lg">{o.icon}</div>
                          <div>
                            <div className="font-semibold">{o.title}</div>
                            <div className="text-sm text-white/65">{o.desc}</div>
                          </div>
                        </div>
                        {selected ? <div className="text-[#2d6bff]">●</div> : <Circle className="size-5 text-white/35" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <Button className="h-12 w-full bg-transparent text-white border border-white/25 hover:bg-white/5" disabled={!canNext} onClick={() => setStep(2)}>
                다음 <ChevronRight className="ml-1 size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-white/15 bg-[#1d2025] text-white">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm text-white/60">질문 2 / 3</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-snug md:text-3xl">주로 어떤 카테고리의 상품에 관심 있으신가요?</h1>
                <p className="mt-2 text-white/70">복수 선택도 가능해요.</p>
              </div>
              <div className="space-y-3">
                {categoryOptions.map((o) => {
                  const selected = category.includes(o.id)
                  return (
                    <button
                      key={o.id}
                      onClick={() =>
                        setCategory((prev) => (prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id]))
                      }
                      className={[
                        "w-full rounded-2xl border px-4 py-4 text-left transition",
                        selected ? "border-[#2d6bff] bg-[#262a31] text-white" : "border-white/15 bg-[#262a31] text-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-lg">{o.icon}</div>
                          <div>
                            <div className="font-semibold">{o.title}</div>
                            <div className="text-sm text-white/65">{o.desc}</div>
                          </div>
                        </div>
                        {selected ? <div className="text-[#2d6bff]">●</div> : <Circle className="size-5 text-white/35" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-12 bg-transparent text-white border border-white/25 hover:bg-white/5" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1 size-4" />
                  이전
                </Button>
                <Button className="h-12 bg-transparent text-white border border-white/25 hover:bg-white/5" disabled={!canNext} onClick={() => setStep(3)}>
                  다음 <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-white/15 bg-[#1d2025] text-white">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-sm text-white/60">질문 3 / 3</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-snug md:text-3xl">평균적으로 얼마 정도의 공동구매에 참여하시나요?</h1>
                <p className="mt-2 text-white/70">추천 상품의 가격대를 맞춰드려요.</p>
              </div>
              <div className="space-y-3">
                {budgetOptions.map((o) => {
                  const selected = budget === o.id
                  return (
                    <button
                      key={o.id}
                      onClick={() => setBudget(o.id)}
                      className={[
                        "w-full rounded-2xl border px-4 py-4 text-left transition",
                        selected ? "border-[#2d6bff] bg-[#262a31] text-white" : "border-white/15 bg-[#262a31] text-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-lg">{o.icon}</div>
                          <div>
                            <div className="font-semibold">{o.title}</div>
                            <div className="text-sm text-white/65">{o.desc}</div>
                          </div>
                        </div>
                        {selected ? <div className="text-[#2d6bff]">●</div> : <Circle className="size-5 text-white/35" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-12 bg-transparent text-white border border-white/25 hover:bg-white/5" onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-1 size-4" />
                  이전
                </Button>
                <Button className="h-12 bg-transparent text-white border border-white/25 hover:bg-white/5" disabled={!canNext} onClick={() => setStep(4)}>
                  결과 보기 <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-white/15 bg-[#1d2025] text-white">
            <CardContent className="space-y-6 p-6">
              <div className="text-center">
                <Badge className="mb-4 rounded-full bg-white text-[#2d6bff]">
                  {persona === "FAST" ? <Flame className="mr-1 size-3.5 text-[#ff6b6b]" /> : <Gem className="mr-1 size-3.5 text-[#2d6bff]" />}
                  {personaTitle}
                </Badge>
                <h1 className="text-4xl font-extrabold">딱 맞는 유형을 찾았어요!</h1>
                <p className="mt-2 text-white/70">{personaDesc}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {resultTags.map((tag) => (
                  <div key={tag} className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-white/80">
                    {tag}
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-3 text-sm text-white/70">이런 상품을 추천드려요</p>
                <div className="space-y-3">
                  {resultProjects.map((p, idx) => {
                    const iconMap = {
                      headphones: <Headphones className="size-5" />,
                      keyboard: <Keyboard className="size-5" />,
                      droplets: <Droplets className="size-5" />,
                      apple: <Apple className="size-5" />,
                    }
                    return (
                      <div key={idx} className="rounded-2xl border border-white/15 bg-[#262a31] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${p.iconBg}`}>
                              {iconMap[p.icon]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold">{p.title}</div>
                              <div className="text-sm text-white/65">{p.subtitle}</div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`text-2xl font-extrabold ${p.rateColor}`}>{p.rate}</div>
                            <div className="text-xs text-white/65">{p.left}</div>
                            <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${p.badgeColor}`}>{p.badge}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Button className="h-12 w-full bg-transparent text-white border border-white/25 hover:bg-white/5">이 성향으로 시작하기</Button>
                <Button className="h-12 w-full bg-transparent text-white border border-white/25 hover:bg-white/5" onClick={() => setStep(1)}>
                  다시 설정하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

