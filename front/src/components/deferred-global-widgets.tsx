"use client"

import dynamic from "next/dynamic"

const WishlistMonitor = dynamic(
  () =>
    import("@/src/components/wishlist-monitor").then((mod) => ({
      default: mod.WishlistMonitor,
    })),
  { ssr: false }
)

const Toaster = dynamic(
  () =>
    import("@/src/components/ui/sonner").then((mod) => ({
      default: mod.Toaster,
    })),
  { ssr: false }
)

export const DeferredGlobalWidgets = () => {
  return (
    <>
      <WishlistMonitor />
      <Toaster />
    </>
  )
}
