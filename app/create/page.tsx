"use client"

import { GamingNavigation } from "@/components/shared"
import WagmiCreateGameForm from "@/components/game-creation/WagmiCreateGameForm"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"


export default function CreateGamePage() {
  return (

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation Bar */}
         <UnifiedGamingNavigation />

        {/* Create Game Form */}
        <div className="container mx-auto px-4 py-8">
          <WagmiCreateGameForm />
        </div>
      </div>

  )
}
