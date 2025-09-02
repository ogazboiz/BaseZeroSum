"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount } from "wagmi"
import { Target, Brain, Eye, Zap, Users } from "lucide-react"
import GameModeSelector from "./GameModeSelector"
import GameSettings from "./GameSettings"
import BattleSummary from "./BattleSummary"
import { useZeroSumContract, GameMode } from "@/hooks/useZeroSumContract"
// import { useHardcoreMysteryContract, GameMode as HardcoreGameMode } from "@/hooks/useHardcoreMysteryContracts"
import { toast } from "react-hot-toast"
import type { GameMode as GameModeType } from "./GameModeSelector"

export default function CreateGameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const { createQuickDraw, createStrategic, loading: zeroSumLoading } = useZeroSumContract()
  // const { createHardcoreMysteryGame, createLastStandGame, loading: hardcoreLoading } = useHardcoreMysteryContract()
  
  const modeFromUrl = searchParams.get("mode")

  const [selectedMode, setSelectedMode] = useState(modeFromUrl || "quick-draw")
  const [entryFee, setEntryFee] = useState([0.0001]) // Start with Quick Draw minimum
  const [gameSettings, setGameSettings] = useState({
    isPrivate: false,
    allowSpectators: true,
    timeout: 90, // Fixed at 90 seconds to match contract
  })
  const [isCreating, setIsCreating] = useState(false)

  // Helper functions for entry fee validation
  const getMaxEntryFee = useCallback(() => {
    switch (selectedMode) {
      case "quick-draw":
        return 1.0
      case "strategic":
        return 2.0
      case "hardcore-mystery":
        return 25.0
      case "last-stand":
        return 25.0
      default:
        return 1.0
    }
  }, [selectedMode])

  const getMinEntryFee = useCallback(() => {
    switch (selectedMode) {
      case "quick-draw":
        return 0.0001
      case "strategic":
        return 0.001
      case "hardcore-mystery":
        return 0.001
      case "last-stand":
        return 0.001
      default:
        return 0.0001
    }
  }, [selectedMode])

  // Update creating state based on contract loading
  useEffect(() => {
    setIsCreating(zeroSumLoading)
  }, [zeroSumLoading])

  // Update entry fee when mode changes to ensure it's within valid range
  useEffect(() => {
    const currentFee = entryFee[0]
    const minFee = getMinEntryFee()
    const maxFee = getMaxEntryFee()
    
    if (currentFee < minFee || currentFee > maxFee) {
      setEntryFee([minFee])
    }
  }, [selectedMode, entryFee, getMinEntryFee, getMaxEntryFee])

  const gameModes: GameModeType[] = [
    {
      id: "quick-draw",
      title: "Quick Draw",
      subtitle: "FAST PACED",
      description: "Test your reflexes in this lightning-fast battle of speed and precision. Each turn you can only subtract 1!",
      players: "2 Players",
      difficulty: "★★☆☆☆",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      range: "0.0001 - 1.0 MNT",
      rules: "Subtract 1 each turn - reach 0 to WIN!",
      avgDuration: "2-5 min",
    },
    {
      id: "strategic",
      title: "Strategic",
      subtitle: "MIND GAMES",
      description: "Outthink your opponent in this battle of wits and strategy. Subtract 10-30% of current number each turn.",
      players: "2 Players",
      difficulty: "★★★★☆",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      range: "0.01 - 2.0 MNT",
      rules: "DON'T reach 0 - force opponent to hit 0!",
      avgDuration: "5-15 min",
    },
    {
      id: "pure-mystery",
      title: "Pure Mystery",
      subtitle: "COMING SOON",
      description: "Numbers stay hidden forever. Pure intuition battle!",
      players: "2 Players",
      difficulty: "★★★★☆",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgGradient: "from-violet-900/20 to-purple-900/20",
      range: "0.5 - 10 MNT",
      rules: "Hidden numbers - pure strategy!",
      avgDuration: "3-6 min",
      comingSoon: true,
    },
    {
      id: "hardcore-mystery",
      title: "Hardcore Mystery",
      subtitle: "COMING SOON",
      description: "One wrong move = game over! Ultimate challenge with hidden numbers and instant death.",
      players: "2 Players",
      difficulty: "★★★★★",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-rose-900/20",
      range: "0.001 - 25.0 MNT",
      rules: "Hidden numbers - instant death on wrong move!",
      avgDuration: "2-5 min",
      comingSoon: true,
    },
    {
      id: "last-stand",
      title: "Last Stand",
      subtitle: "COMING SOON",
      description: "8-player survival battle! Last player standing wins. Hidden numbers with instant elimination on wrong moves.",
      players: "8 Players",
      difficulty: "★★★★★",
      icon: Users,
      gradient: "from-orange-400 via-red-500 to-pink-600",
      bgGradient: "from-orange-900/20 to-red-900/20",
      range: "0.001 - 25.0 MNT",
      rules: "8 players, last survivor wins! Instant death on wrong moves!",
      avgDuration: "10-20 min",
      comingSoon: true,
    },
  ]

  // Filter only the implemented game modes (not coming soon)
  const availableGameModes: GameModeType[] = gameModes.filter(mode => !mode.comingSoon)

  const handleCreateBattle = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!")
      return
    }

    if (!address) {
      toast.error("Wallet address not found!")
      return
    }

    const entryFeeValue = entryFee[0].toString()

    try {
      setIsCreating(true)
      
      let result
      
      if (selectedMode === "quick-draw") {
        result = await createQuickDraw(entryFeeValue)
      } else if (selectedMode === "strategic") {
        result = await createStrategic(entryFeeValue)
      } else {
        toast.error("Selected game mode is not available yet!")
        return
      }

      if (result.success) {
        // Redirect to waiting room or browse page with the created game
        if (result.gameId) {
          // All modes go to normal waiting room (hardcore disabled)
          router.push(`/battle/waiting/${result.gameId}?mode=${selectedMode}&entryFee=${entryFeeValue}`)
        } else {
          router.push(`/browse?created=true&mode=${selectedMode}`)
        }
      }
    } catch (error: any) {
      console.error("Failed to create battle:", error)
      // Error handling is done in the hook via toast
    } finally {
      setIsCreating(false)
    }
  }

  const selectedGameMode = availableGameModes.find((mode) => mode.id === selectedMode)

  return (
    <div className="relative  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full px-6 py-2 mb-6">
          <span className="text-emerald-400 font-bold">CREATE BATTLE</span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">CREATE YOUR BATTLE</h1>
        <p className="text-lg sm:text-xl text-slate-300 font-medium">Configure your battle and challenge other warriors</p>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 font-medium">
              ⚠️ Please connect your wallet to create a battle
            </p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Mode Selection */}
        <div className="lg:col-span-2">
          <GameModeSelector
            gameModes={availableGameModes}
            selectedMode={selectedMode}
            onModeSelect={setSelectedMode}
          />

          {/* Game Settings */}
          <GameSettings
            entryFee={entryFee}
            onEntryFeeChange={setEntryFee}
            gameSettings={gameSettings}
            onGameSettingsChange={setGameSettings}
            maxEntryFee={getMaxEntryFee()}
            minEntryFee={getMinEntryFee()}
            selectedMode={selectedMode}
          />
        </div>

        {/* Battle Summary & Create */}
        <div className="lg:col-span-1">
          <BattleSummary
            selectedMode={selectedMode}
            gameModes={availableGameModes}
            entryFee={entryFee}
            gameSettings={gameSettings}
            isCreating={isCreating}
            onCreateBattle={handleCreateBattle}
            isConnected={isConnected}
            contractMode={selectedMode === "quick-draw" ? GameMode.QUICK_DRAW : 
                         selectedMode === "strategic" ? GameMode.STRATEGIC :
                         GameMode.QUICK_DRAW}
          />
        </div>
      </div>

      {/* Contract Info */}
      <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4">📋 Battle Rules</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold text-emerald-400 mb-2">Quick Draw Mode:</h4>
            <ul className="text-slate-300 space-y-1 text-sm">
              <li>• Starting number: 15-50 (randomly generated)</li>
              <li>• Each turn: subtract exactly 1</li>
              <li>• Goal: be the first to reach 0</li>
              <li>• Turn timeout: 90 seconds</li>
              <li>• 2 timeouts = you lose</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-blue-400 mb-2">Strategic Mode:</h4>
            <ul className="text-slate-300 space-y-1 text-sm">
              <li>• Starting number: 80-200 (randomly generated)</li>
              <li>• Each turn: subtract 10-30% of current number</li>
              <li>• Goal: force opponent to reach 0</li>
              <li>• Turn timeout: 90 seconds</li>
              <li>• 2 timeouts = you lose</li>
            </ul>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="text-lg font-bold text-rose-400 mb-2">Hardcore Mystery Mode:</h4>
            <ul className="text-slate-300 space-y-1 text-sm">
              <li>• Starting number: Hidden (0-100 range)</li>
              <li>• Each turn: subtract any valid number</li>
              <li>• Goal: reach exactly 0 to win</li>
              <li>• Turn timeout: 90 seconds</li>
              <li>• Wrong move = instant loss!</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-orange-400 mb-2">Last Stand Mode:</h4>
            <ul className="text-slate-300 space-y-1 text-sm">
              <li>• 8-player battle royale survival</li>
              <li>• Hidden numbers with instant elimination</li>
              <li>• Goal: be the last player standing</li>
              <li>• Turn timeout: 90 seconds</li>
              <li>• Wrong move = instant elimination!</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
          <p className="text-slate-400 text-sm">
            💡 <strong>Fair Play:</strong> Starting numbers are generated using both players' addresses, 
            block data, and a custom salt for maximum fairness and unpredictability.
          </p>
        </div>
      </div>
    </div>
  )
}