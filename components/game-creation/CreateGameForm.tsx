"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Target, Brain, Eye, Zap } from "lucide-react"
import GameModeSelector from "./GameModeSelector"
import GameSettings from "./GameSettings"
import BattleSummary from "./BattleSummary"
import type { GameMode } from "./GameModeSelector"

export default function CreateGameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeFromUrl = searchParams.get("mode")

  const [selectedMode, setSelectedMode] = useState(modeFromUrl || "quick-draw")
  const [entryFee, setEntryFee] = useState([0.1])
  const [gameSettings, setGameSettings] = useState({
    isPrivate: false,
    allowSpectators: true,
    timeout: 180, // Fixed at 3 minutes
  })
  const [isCreating, setIsCreating] = useState(false)

  const gameModes: GameMode[] = [
    {
      id: "quick-draw",
      title: "Quick Draw",
      subtitle: "FAST PACED",
      description: "Test your reflexes in this lightning-fast battle of speed and precision.",
      players: "2 Players",
      difficulty: "★★☆☆☆",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      range: "0.01 - 0.5 ETH",
      rules: "First to hit the target wins",
      avgDuration: "2-5 min",
    },
    {
      id: "strategic",
      title: "Strategic",
      subtitle: "MIND GAMES",
      description: "Outthink your opponent in this battle of wits and strategy.",
      players: "2 Players",
      difficulty: "★★★☆☆",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      range: "0.1 - 1.0 ETH",
      rules: "Best of 3 rounds",
      avgDuration: "10-15 min",
    },
    {
      id: "mystery",
      title: "Mystery",
      subtitle: "UNKNOWN",
      description: "Face the unknown in this mysterious battle with hidden rules.",
      players: "2-4 Players",
      difficulty: "★★★★☆",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgGradient: "from-violet-900/20 to-purple-900/20",
      range: "0.2 - 2.0 ETH",
      rules: "Rules revealed during battle",
      avgDuration: "15-30 min",
    },
    {
      id: "hardcore-mystery",
      title: "Hardcore Mystery",
      subtitle: "EXTREME",
      description: "The ultimate challenge for the bravest warriors.",
      players: "2 Players",
      difficulty: "★★★★★",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-pink-900/20",
      range: "0.5 - 5.0 ETH",
      rules: "Everything is unknown",
      avgDuration: "30-60 min",
    },
  ]

  const handleCreateBattle = async () => {
    setIsCreating(true)
    setTimeout(() => {
      const battleId = Math.floor(Math.random() * 1000) + 1
      router.push(`/browse?created=${battleId}&mode=${selectedMode}`)
    }, 2000)
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full px-6 py-2 mb-6">
          <span className="text-emerald-400 font-bold">CREATE BATTLE</span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <h1 className="text-5xl font-black text-white mb-4">CREATE YOUR BATTLE</h1>
        <p className="text-xl text-slate-300 font-medium">Configure your battle and challenge other warriors</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Mode Selection */}
        <div className="lg:col-span-2">
          <GameModeSelector
            gameModes={gameModes}
            selectedMode={selectedMode}
            onModeSelect={setSelectedMode}
          />

          {/* Game Settings */}
          <GameSettings
            entryFee={entryFee}
            onEntryFeeChange={setEntryFee}
            gameSettings={gameSettings}
            onGameSettingsChange={setGameSettings}
          />
        </div>

        {/* Battle Summary & Create */}
        <div className="lg:col-span-1">
          <BattleSummary
            selectedMode={selectedMode}
            gameModes={gameModes}
            entryFee={entryFee}
            gameSettings={gameSettings}
            isCreating={isCreating}
            onCreateBattle={handleCreateBattle}
          />
        </div>
      </div>
    </div>
  )
}
