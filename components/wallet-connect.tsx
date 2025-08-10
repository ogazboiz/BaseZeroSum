"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "./wallet-provider"
import { Wallet, LogOut, Loader2 } from "lucide-react"

export function WalletConnect() {
  const { isConnected, address, balance, connect, disconnect, isLoading } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading) {
    return (
      <Button disabled className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-6 py-3 rounded-xl">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        CONNECTING...
      </Button>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="bg-slate-800/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="font-bold text-emerald-400">{balance} ETH</span>
          </div>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/30 rounded-xl px-4 py-2">
          <span className="text-slate-300 text-sm font-mono">{formatAddress(address!)}</span>
        </div>
        <Button
          onClick={disconnect}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl font-bold bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          DISCONNECT
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={connect}
      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
    >
      <Wallet className="w-4 h-4 mr-2" />
      CONNECT WALLET
    </Button>
  )
}
