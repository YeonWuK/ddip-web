"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { X } from "lucide-react"

export interface RewardTierFormData {
  id?: number
  title: string
  description: string
  price: number
  limitQuantity: number | null
}

interface RewardTierFormProps {
  tiers: RewardTierFormData[]
  onChange: (tiers: RewardTierFormData[]) => void
}

export function RewardTierForm({ tiers, onChange }: RewardTierFormProps) {
  const addTier = () => {
    onChange([
      ...tiers,
      {
        title: "",
        description: "",
        price: 0,
        limitQuantity: null,
      },
    ])
  }

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index))
  }

  const updateTier = (index: number, data: Partial<RewardTierFormData>) => {
    const updated = [...tiers]
    updated[index] = { ...updated[index], ...data }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">리워드 티어</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTier}>
          리워드 추가
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          리워드를 추가해주세요
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">리워드 {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTier(index)}
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`tier-title-${index}`}>리워드 제목 *</Label>
                  <Input
                    id={`tier-title-${index}`}
                    value={tier.title}
                    onChange={(e) => updateTier(index, { title: e.target.value })}
                    placeholder="예: 얼리버드 1개"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tier-description-${index}`}>리워드 설명 *</Label>
                  <Input
                    id={`tier-description-${index}`}
                    value={tier.description}
                    onChange={(e) => updateTier(index, { description: e.target.value })}
                    placeholder="예: 스마트 조명 1개 + 전용 리모컨"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`tier-price-${index}`}>가격 (원) *</Label>
                    <Input
                      id={`tier-price-${index}`}
                      type="number"
                      min="1"
                      value={tier.price || ""}
                      onChange={(e) => updateTier(index, { price: Number(e.target.value) })}
                      placeholder="45000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tier-limit-${index}`}>한정 수량 (선택)</Label>
                    <Input
                      id={`tier-limit-${index}`}
                      type="number"
                      min="1"
                      value={tier.limitQuantity || ""}
                      onChange={(e) =>
                        updateTier(index, {
                          limitQuantity: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
