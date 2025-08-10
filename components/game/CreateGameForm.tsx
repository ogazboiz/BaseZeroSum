"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Target, Brain, Eye, Zap, Swords } from "lucide-react"
import GameModeSelector, { GameMode } from "./GameModeSelector"
import GameSettings from "./GameSettings"
import BattleSummary from "./BattleSummary"

export default function CreateGameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeFromUrl = searchParams.get("mode")

  const [selectedMode, setSelectedMode] = useState(modeFromUrl || "quick-draw")
  const [entryFee, setEntryFee] = useState([0.1])
  const [gameSettings, setGameSettings] = useState({
    isPrivate: false,
    allowSpectators: true,
    timeout: 300,
  })
  const [isCreating, setIsCreating] = useState(false)

  const gameModes: GameMode[] = [
    {
      id: "quick-draw",
      title: "Quick Draw",
      subtitle: "LIGHTNING DUEL",
      description: "First to reach exactly zero wins! Pure speed and calculation.",
      players: "1v1",
      difficulty: "★★☆☆☆",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      range: "15-49",
      rules: "Subtract exactly 1 each turn",
      avgDuration: "2-4 min",
    },
    {
      id: "strategic",
      title: "Strategic",
      subtitle: "MIND WARFARE",
      description: "Don't reach zero to win! Master percentage calculations.",
      players: "1v1",
      difficulty: "★★★☆☆",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      range: "80-199",
      rules: "Subtract 10-30% each turn",
      avgDuration: "5-8 min",
    },
    {
      id: "pure-mystery",
      title: "Pure Mystery",
      subtitle: "HIDDEN WARFARE",
      description: "Numbers stay hidden forever. Pure intuition battle!",
      players: "1v1",
      difficulty: "★★★★☆",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgGradient: "from-violet-900/20 to-purple-900/20",
      range: "40-109 (HIDDEN)",
      rules: "Any subtraction, forgiving",
      avgDuration: "3-6 min",
    },
    {
      id: "hardcore-mystery",
      title: "Hardcore Mystery",
      subtitle: "INSTANT DEATH",
      description: "One wrong move = game over! Ultimate challenge.",
      players: "1v1",
      difficulty: "★★★★★",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-pink-900/20",
      range: "40-109 (HIDDEN)",
      rules: "Any subtraction, instant loss",
      avgDuration: "2-5 min",
    },
  ]

  const selectedGameMode = gameModes.find((mode) => mode.id === selectedMode)

  const handleCreateBattle = async () => {
    setIsCreating(true)

    // Simulate battle creation
    setTimeout(() => {
      // Generate a random battle ID
      const battleId = Math.floor(Math.random() * 1000) + 1

      // Redirect to the waiting room or browse page
      router.push(`/browse?created=${battleId}&mode=${selectedMode}`)
    }, 2000)
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-6 py-2 mb-6">
          <Swords className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400 font-bold">CREATE BATTLE</span>
        </div>
        <h1 className="text-5xl font-black text-white mb-4">FORGE YOUR BATTLEFIELD</h1>
        <p className="text-xl text-slate-300 font-medium">Choose your weapon and set the stakes</p>
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
            selectedGameMode={selectedGameMode}
            entryFee={entryFee}
            isCreating={isCreating}
            onCreateBattle={handleCreateBattle}
          />
        </div>
      </div>
    </div>
  )
}
