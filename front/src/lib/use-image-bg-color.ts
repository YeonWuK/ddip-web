"use client"

import { useEffect, useState } from "react"

const colorCache = new Map<string, string>()
const pendingCache = new Map<string, Promise<string>>()
const FALLBACK_COLOR = "rgb(243, 244, 246)"

function mixWithNeutral(r: number, g: number, b: number) {
  // 너무 진하거나 어두운 색이 배경에 깔려 카드 가독성을 해치지 않도록 중성색과 섞음
  const neutral = 244
  const ratio = 0.35
  const mr = Math.round(r * (1 - ratio) + neutral * ratio)
  const mg = Math.round(g * (1 - ratio) + neutral * ratio)
  const mb = Math.round(b * (1 - ratio) + neutral * ratio)
  return `rgb(${mr}, ${mg}, ${mb})`
}

async function extractAverageColor(src: string): Promise<string> {
  if (!src) return FALLBACK_COLOR
  if (colorCache.has(src)) return colorCache.get(src) as string
  if (pendingCache.has(src)) return pendingCache.get(src) as Promise<string>

  const task = new Promise<string>((resolve) => {
    const img = new window.Image()
    img.decoding = "async"
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const w = 16
        const h = 16
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          colorCache.set(src, FALLBACK_COLOR)
          resolve(FALLBACK_COLOR)
          return
        }

        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)

        let r = 0
        let g = 0
        let b = 0
        let weightSum = 0

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha === 0) continue
          const pr = data[i]
          const pg = data[i + 1]
          const pb = data[i + 2]

          // 흰/회색 여백 영향 줄이기: 너무 밝은 픽셀은 샘플에서 제외
          const luminance = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb
          if (luminance > 245) continue

          // 중앙 가중치: 피사체가 가운데 있는 전형적인 상품 이미지에 유리
          const pixel = i / 4
          const x = pixel % w
          const y = Math.floor(pixel / w)
          const dx = (x - (w - 1) / 2) / (w / 2)
          const dy = (y - (h - 1) / 2) / (h / 2)
          const dist = Math.sqrt(dx * dx + dy * dy)
          const weight = Math.max(0.2, 1 - dist)

          r += pr * weight
          g += pg * weight
          b += pb * weight
          weightSum += weight
        }

        const color =
          weightSum > 0
            ? mixWithNeutral(Math.round(r / weightSum), Math.round(g / weightSum), Math.round(b / weightSum))
            : FALLBACK_COLOR

        colorCache.set(src, color)
        resolve(color)
      } catch {
        colorCache.set(src, FALLBACK_COLOR)
        resolve(FALLBACK_COLOR)
      } finally {
        pendingCache.delete(src)
      }
    }

    img.onerror = () => {
      colorCache.set(src, FALLBACK_COLOR)
      pendingCache.delete(src)
      resolve(FALLBACK_COLOR)
    }

    img.src = src
  })

  pendingCache.set(src, task)
  return task
}

export function useImageBgColor(src: string, fallbackColor: string = FALLBACK_COLOR) {
  const [bgColor, setBgColor] = useState<string>(colorCache.get(src) ?? fallbackColor)

  useEffect(() => {
    let cancelled = false
    if (!src) {
      setBgColor(fallbackColor)
      return
    }

    if (colorCache.has(src)) {
      setBgColor(colorCache.get(src) as string)
      return
    }

    extractAverageColor(src).then((color) => {
      if (!cancelled) setBgColor(color)
    })

    return () => {
      cancelled = true
    }
  }, [src, fallbackColor])

  return bgColor
}
