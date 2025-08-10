"use client"

import { Button } from "@/components/ui/button"
import { Gamepad2, Coins } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function GamingNavigation() {
  const router = useRouter()

  return (
    <nav className="relative z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                ZEROSUM
              </span>
              <div className="text-xs text-slate-400 font-medium">BATTLE ARENA</div>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="bg-slate-800/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <Coins className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400">2.45 ETH</span>
              </div>
            </div>
            <Button
              onClick={() => router.push("/create")}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
            >
              CREATE BATTLE
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
