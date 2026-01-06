import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Badge } from "@/src/components/ui/badge"
import { CheckCircle2, Users, Clock } from "lucide-react"

interface RewardCardProps {
  id: string
  title: string
  amount: number
  description: string
  items: string[]
  estimatedDelivery: string
  limited?: number
  remaining?: number
  backers: number
  featured?: boolean
}

export function RewardCard({
  title,
  amount,
  description,
  items,
  estimatedDelivery,
  limited,
  remaining,
  backers,
  featured,
}: RewardCardProps) {
  return (
    <Card className={featured ? "border-primary shadow-lg" : ""}>
      {featured && (
        <div className="rounded-t-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
          인기 리워드
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {limited && (
            <Badge variant="secondary" className="shrink-0">
              한정 {limited}개
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{amount.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span>예상 배송: {estimatedDelivery}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span>{backers}명 참여</span>
          </div>
          {limited && remaining !== undefined && (
            <div className="mt-2 text-xs">
              <span className="font-semibold text-destructive">{remaining}개 남음</span>
              <span className="text-muted-foreground"> / {limited}개 중</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" size="lg" disabled={limited !== undefined && remaining === 0}>
          {limited !== undefined && remaining === 0 ? "품절" : "이 리워드 선택"}
        </Button>
      </CardFooter>
    </Card>
  )
}
