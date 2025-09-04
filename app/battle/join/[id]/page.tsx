"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Gamepad2,
  Target,
  Brain,
  Eye,
  Zap,
  Coins,
  Swords,
  Shield,
  AlertTriangle,
  CheckCircle,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAccount } from "wagmi"
import { toast } from "react-hot-toast"
import { useZeroSumContract, useZeroSumData } from "@/hooks/useZeroSumContract"
import { formatEther } from "viem"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function JoinBattlePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const battleId = params.id
  const mode = searchParams.get("mode") || "quick-draw"
  
  // Blockchain integration
  const { joinGame } = useZeroSumContract()
  const { getGame, getPlayers } = useZeroSumData()

  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  // Game mode configurations
  const gameModeConfigs = {
    "quick-draw": {
      title: "Quick Draw",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      rules: "First to reach exactly zero wins! You can only subtract 1 each turn.",
      numberRange: "15-49",
      difficulty: "★★☆☆☆",
    },
    strategic: {
      title: "Strategic",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      rules: "Don't reach zero to win! You can subtract 10-30% of current number each turn.",
      numberRange: "80-199",
      difficulty: "★★★☆☆",
    },
    "pure-mystery": {
      title: "Pure Mystery",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      rules: "Numbers stay hidden forever. Any subtraction allowed, forgiving rules.",
      numberRange: "40-109 (HIDDEN)",
      difficulty: "★★★★☆",
    },
    "hardcore-mystery": {
      title: "Hardcore Mystery",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      rules: "Numbers hidden forever. One wrong move = instant game over!",
      numberRange: "40-109 (HIDDEN)",
      difficulty: "★★★★★",
    },
  }

  const [battle, setBattle] = useState({
    id: battleId,
    mode: gameModeConfigs[mode]?.title || "Quick Draw",
    creator: "",
    creatorAddress: "",
    entryFee: "0",
    prizePool: "0",
    timeLeft: "5m 0s",
    difficulty: gameModeConfigs[mode]?.difficulty || "★★☆☆☆",
    icon: gameModeConfigs[mode]?.icon || Target,
    gradient: gameModeConfigs[mode]?.gradient || "from-emerald-400 via-teal-500 to-cyan-600",
    rules: gameModeConfigs[mode]?.rules || "First to reach exactly zero wins!",
    numberRange: gameModeConfigs[mode]?.numberRange || "15-49",
    maxTurns: "15 turns max",
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch real blockchain data - memoized to prevent infinite loops
  const fetchGameData = useCallback(async () => {
    if (!battleId) return
    
    try {
      setIsLoading(true)
      
      console.log(`Fetching game data for join page, battle ${battleId}`)
      
      // Get game data from blockchain
      const gameData = await getGame(Number(battleId))
      if (gameData) {
        const players = await getPlayers(Number(battleId))
        
        setBattle(prev => ({
          ...prev,
          creator: players[0] || "",
          creatorAddress: players[0] || "",
          entryFee: gameData.entryFee ? (typeof gameData.entryFee === 'bigint' ? formatEther(gameData.entryFee) : gameData.entryFee.toString()) : "0",
          prizePool: gameData.prizePool ? (typeof gameData.prizePool === 'bigint' ? formatEther(gameData.prizePool) : gameData.prizePool.toString()) : "0",
        }))
      }
    } catch (error) {
      console.error("Failed to fetch game data:", error)
      // Don't show error toast for network issues to avoid spam
      if (!error.message?.includes("network") && !error.message?.includes("timeout")) {
        toast.error("Failed to load game data")
      }
    } finally {
      setIsLoading(false)
    }
  }, [battleId, getGame, getPlayers])

  // Only fetch once when component mounts
  useEffect(() => {
    if (battleId) {
      fetchGameData()
    }
  }, [battleId]) // Only depend on battleId, not the functions

  // Check if current user is the creator
  useEffect(() => {
    if (address && battle.creatorAddress) {
      const isUserCreator = address.toLowerCase() === battle.creatorAddress.toLowerCase()
      setIsCreator(isUserCreator)
      
      if (isUserCreator) {
        toast.error("You cannot join your own battle!")
        router.push("/browse")
      }
    }
  }, [address, battle.creatorAddress, router])

  const handleJoinBattle = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to join this battle!")
      return
    }

    if (isCreator) {
      toast.error("You cannot join your own battle!")
      return
    }

    setIsJoining(true)

    try {
      // Join game on blockchain
      const result = await joinGame(Number(battleId), battle.entryFee)
      
      if (result.success) {
        toast.success("Successfully joined the battle!")
        setHasJoined(true)
        
        // Redirect to battle after 2 seconds
        setTimeout(() => {
          router.push(`/battle/${battleId}?mode=${mode}`)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to join battle:", error)
      toast.error("Failed to join battle")
    } finally {
      setIsJoining(false)
    }
  }

  if (hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-center">
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">BATTLE JOINED!</h2>
            <p className="text-slate-300 mb-6">Entering the arena...</p>
            <div className="animate-pulse">
              <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
     <UnifiedGamingNavigation/>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium">Error: {error}</p>
              </div>
              <Button
                onClick={() => {
                  setError(null)
                  fetchGameData()
                }}
                size="sm"
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10 rounded-lg"
                disabled={isLoading}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl font-bold text-white">Loading battle data...</p>
              <p className="text-slate-400">Fetching from blockchain</p>
            </div>
          </div>
        ) : (
        <>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-4">JOIN BATTLE</h1>
          <p className="text-xl text-slate-300 font-medium">Review the battle details and enter the arena</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Battle Details */}
          <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${battle.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    <battle.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black text-white">{battle.mode}</CardTitle>
                    <p className="text-slate-300 font-medium">Battle #{battle.id}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setError(null)
                    fetchGameData()
                  }}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800/50 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-400 mb-2">ENTRY FEE</p>
                  <p className="text-2xl font-black text-cyan-400">{battle.entryFee} ETH</p>
                </div>
                <div className="bg-slate-900/40 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-400 mb-2">PRIZE POOL</p>
                  <p className="text-2xl font-black text-emerald-400">{battle.prizePool} ETH</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Creator:</span>
                  <span className="font-bold text-white">{battle.creator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Difficulty:</span>
                  <span className="font-bold text-amber-400">{battle.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Number Range:</span>
                  <span className="font-bold text-violet-400">{battle.numberRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Max Duration:</span>
                  <span className="font-bold text-white">{battle.maxTurns}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-800/60 to-slate-800/30 rounded-xl p-4">
                <h3 className="font-bold text-white mb-2">GAME RULES</h3>
                <p className="text-slate-300 text-sm">{battle.rules}</p>
              </div>
            </CardContent>
          </Card>

          {/* Join Action */}
          <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-white flex items-center">
                <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                ENTER THE ARENA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-cyan-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-cyan-400 mb-2">FAIR PLAY GUARANTEE</h3>
                    <p className="text-slate-300 text-sm">
                      Numbers are generated only when both players join, ensuring complete fairness. No one has any
                      advantage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-amber-400 mb-2">TURN TIMER</h3>
                    <p className="text-slate-300 text-sm">
                      Each player has 3 minutes per turn. If you don't make a move within the time limit, your turn will
                      be skipped automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Creator Warning */}
              {isCreator && (
                <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 border border-rose-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                    <div>
                      <h3 className="font-bold text-rose-400 mb-1">CREATOR DETECTED</h3>
                      <p className="text-rose-300 text-sm">
                        You cannot join your own battle. You're already the creator of this game.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">You will pay:</span>
                  <span className="font-black text-rose-400">{battle.entryFee} ETH</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">Potential win:</span>
                  <span className="font-black text-emerald-400">{battle.prizePool} ETH</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">Your profit:</span>
                  <span className="font-black text-cyan-400">
                    {(Number.parseFloat(battle.prizePool) - Number.parseFloat(battle.entryFee)).toFixed(3)} ETH
                  </span>
                </div>
              </div>

              <Button
                onClick={handleJoinBattle}
                disabled={isJoining || isCreator}
                className={`w-full ${
                  isCreator 
                    ? "bg-slate-600 cursor-not-allowed" 
                    : `bg-gradient-to-r ${battle.gradient} hover:shadow-2xl hover:scale-105`
                } text-white font-black text-xl py-4 rounded-xl transition-all transform`}
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    JOINING BATTLE...
                  </>
                ) : isCreator ? (
                  <>
                    <AlertTriangle className="w-6 h-6 mr-3" />
                    CANNOT JOIN OWN BATTLE
                  </>
                ) : (
                  <>
                    <Crown className="w-6 h-6 mr-3" />
                    JOIN BATTLE
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center font-medium">
                By joining, you agree to the battle terms and will pay the entry fee
              </p>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
