"use client"

import { useEffect } from "react"
import { useAuctionListSocket } from "@/src/hooks/useAuctionListSocket"
import type { AuctionListBidUpdatePayload } from "@/src/hooks/useAuctionListSocket"

type HomeAuctionSocketBridgeProps = {
  onBidUpdate: (data: AuctionListBidUpdatePayload) => void
}

const HomeAuctionSocketBridge = ({ onBidUpdate }: HomeAuctionSocketBridgeProps) => {
  const { onBidUpdate: registerBidUpdate } = useAuctionListSocket()

  useEffect(() => {
    return registerBidUpdate(onBidUpdate)
  }, [registerBidUpdate, onBidUpdate])

  return null
}

export default HomeAuctionSocketBridge
