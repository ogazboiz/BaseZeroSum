"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gamepad2,
  Target,
  Brain,
  Users,
  Coins,
  Swords,
  Clock,
  Copy,
  Share2,
  Eye,
  Loader2,
  X,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Trophy,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAccount } from "wagmi"
import { 
  useZeroSumData, 
  useZeroSumContract,
  GameData,
  GameStatus,
  GameMode
} from "@/hooks/useZeroSumContract"
import { 
  useHardcoreMysteryData,
  useHardcoreMysteryContract,
  HardcoreMysteryGame,
  GameStatus as HardcoreGameStatus,
  GameMode as HardcoreGameMode
} from "@/hooks/useHardcoreMysteryContracts"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function UpdatedWaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  
  const battleId = params.id as string
  const gameId = battleId ? parseInt(battleId) : null
  const gameMode = searchParams.get("mode") || "quick-draw"
  const isHardcoreGame = gameMode === "hardcore-mystery"

  // Blockchain hooks - use appropriate contract based on game mode
  const zeroSumData = useZeroSumData()
  const hardcoreData = useHardcoreMysteryData()
  
  // Get the appropriate contract data based on game mode
  const contractData = isHardcoreGame ? hardcoreData : zeroSumData
  const { getGame, getPlayers, contractsReady, providerReady } = contractData
  
  const zeroSumContract = useZeroSumContract()
  const hardcoreContract = useHardcoreMysteryContract()
  
  const {
    cancelWaitingGame,
    withdraw,
    loading: transactionLoading
  } = isHardcoreGame ? hardcoreContract : zeroSumContract

  // State management
  const [gameData, setGameData] = useState<GameData | HardcoreMysteryGame | null>(null)
  const [players, setPlayers] = useState<string[]>([])
  const [userBalance, setUserBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isPolling, setIsPolling] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<string>("")

  // Game mode configurations
  const gameModeConfigs = {
    [GameMode.QUICK_DRAW]: {
      title: "Quick Draw",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      rules: "Subtract exactly 1 each turn - reach 0 to WIN!",
      difficulty: "★★☆☆☆",
      avgDuration: "2-5 min",
    },
    [GameMode.STRATEGIC]: {
      title: "Strategic",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      rules: "Subtract 10-30% each turn - force opponent to hit 0!",
      difficulty: "★★★★☆",
      avgDuration: "5-15 min",
    },
  }

  // Hardcore game mode configuration
  const hardcoreGameModeConfig = {
    [HardcoreGameMode.HARDCORE_MYSTERY]: {
      title: "Hardcore Mystery",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-rose-900/20",
      rules: "Hidden numbers - instant death on wrong move!",
      difficulty: "★★★★★",
      avgDuration: "2-5 min",
    },
  }

  // Determine the current game mode configuration
  const getCurrentGameConfig = () => {
    if (isHardcoreGame) {
      return hardcoreGameModeConfig[HardcoreGameMode.HARDCORE_MYSTERY]
    }
    
    // For ZeroSum games, determine mode from gameData or default to Quick Draw
    if (gameData) {
      if (gameData.mode === GameMode.QUICK_DRAW) {
        return gameModeConfigs[GameMode.QUICK_DRAW]
      } else if (gameData.mode === GameMode.STRATEGIC) {
        return gameModeConfigs[GameMode.STRATEGIC]
      }
    }
    
    // Default to Quick Draw
    return gameModeConfigs[GameMode.QUICK_DRAW]
  }

  const config = getCurrentGameConfig()

  // Fetch game data
  const fetchGameData = useCallback(async () => {
    if (!gameId || !isConnected || !address || !contractsReady) {
      console.log('⏸️ Skipping fetch - requirements not met')
      return
    }

    console.log(`🎮 Fetching game data for waiting room ${gameId}`)
    setIsPolling(true)
    setError(null)

    try {
      // Fetch game data and players
      const [game, gamePlayers] = await Promise.all([
        getGame(gameId),
        getPlayers(gameId)
      ])

      if (!game) {
        throw new Error(`Game #${gameId} not found`)
      }

      console.log('📊 Game data:', game)
      console.log('👥 Players:', gamePlayers)

      // Check if user is the creator
      const isUserCreator = gamePlayers.length > 0 && 
                           gamePlayers[0].toLowerCase() === address.toLowerCase()

      if (!isUserCreator) {
        // User is not the creator, redirect to battle page
        console.log('⚠️ User is not the creator, redirecting to battle page')
        const battleUrl = isHardcoreGame ? `/battle/hardcore/${gameId}` : `/battle/${gameId}`
        router.push(battleUrl)
        return
      }

      // Check if game has started (opponent joined)
      const isWaiting = isHardcoreGame ? 
        game.status === HardcoreGameStatus.WAITING : 
        game.status === GameStatus.WAITING
      
      if (!isWaiting) {
        console.log('🎮 Game has started, redirecting to battle page')
        toast.success("Opponent joined! Battle starting...")
        const battleUrl = isHardcoreGame ? `/battle/hardcore/${gameId}` : `/battle/${gameId}`
        router.push(battleUrl)
        return
      }

      // Get user balance only for ZeroSum games
      let balance = "0"
      if (!isHardcoreGame && zeroSumData.getPlayerBalance) {
        try {
          balance = await zeroSumData.getPlayerBalance(address)
        } catch (balanceError) {
          console.warn('Could not fetch user balance:', balanceError)
        }
      }

      setGameData(game)
      setPlayers(gamePlayers)
      setUserBalance(balance)
      setLastCheckTime(new Date().toLocaleTimeString())

    } catch (error) {
      console.error('❌ Error fetching game data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load game data')
    } finally {
      setIsPolling(false)
    }
  }, [gameId, isConnected, address, contractsReady, getGame, getPlayers, router])

  // Initial data fetch
  useEffect(() => {
    if (providerReady) {
      setIsLoading(true)
      fetchGameData().finally(() => setIsLoading(false))
    }
  }, [providerReady, fetchGameData])

  // Refresh game data when wallet address changes (wallet switching)
  useEffect(() => {
    if (providerReady && contractsReady && address) {
      console.log('🔄 Wallet address changed, refreshing waiting game data...', address)
      setIsLoading(true)
      fetchGameData().finally(() => setIsLoading(false))
    }
  }, [address, providerReady, contractsReady, fetchGameData])

  // Set share URL
  useEffect(() => {
    if (typeof window !== 'undefined' && gameId) {
      const url = isHardcoreGame 
        ? `${window.location.origin}/battle/hardcore/${gameId}`
        : `${window.location.origin}/battle/${gameId}`
      setShareUrl(url)
    }
  }, [gameId, isHardcoreGame])

  // Polling for opponent joining
  useEffect(() => {
    if (!gameData) return
    
    const isWaiting = isHardcoreGame ? 
      gameData.status === HardcoreGameStatus.WAITING : 
      gameData.status === GameStatus.WAITING
    
    if (!isWaiting) return

    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for opponent...')
      fetchGameData()
    }, 15000) // Check every 15 seconds

    return () => clearInterval(pollInterval)
  }, [gameData?.status, fetchGameData, isHardcoreGame])

  // Action handlers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Battle link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const handleShareBattle = async () => {
    if (navigator.share && gameData) {
      try {
        const gameTitle = config.title
        await navigator.share({
          title: `Join my ${gameTitle} battle!`,
          text: `I've created a ${gameTitle} battle with ${gameData.entryFee} MNT entry fee. Join me!`,
          url: shareUrl,
        })
      } catch (err) {
        console.log('Share failed:', err)
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCancelBattle = async () => {
    if (!gameId || !gameData) return

    try {
      const result = await cancelWaitingGame(gameId)
      if (result.success) {
        toast.success("Battle cancelled successfully!")
        setTimeout(() => {
          router.push("/my-games")
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to cancel battle:', error)
      toast.error("Failed to cancel battle")
    }
  }

  const handleViewBattle = () => {
    if (gameId) {
      const battleUrl = isHardcoreGame ? `/battle/hardcore/${gameId}` : `/battle/${gameId}`
      router.push(battleUrl)
    }
  }

  const handleWithdraw = async () => {
    try {
      const result = await withdraw()
      if (result.success) {
        toast.success("Balance withdrawn successfully!")
        setTimeout(() => {
          fetchGameData()
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to withdraw:', error)
      toast.error("Failed to withdraw balance")
    }
  }

  // Game config is already defined above

  // Loading state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400">Please connect your wallet to access the waiting room</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-xl font-bold text-white">Loading Waiting Room...</p>
            <p className="text-slate-400">Fetching battle data from blockchain</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="relative  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {error || `Battle #${battleId} Not Found`}
              </h2>
              <p className="text-slate-400 mb-4">
                {error || "This battle doesn't exist or couldn't be loaded"}
              </p>
              <div className="space-x-3">
                <Button
                  onClick={() => fetchGameData().finally(() => setIsLoading(false))}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={isPolling}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                  {isPolling ? "Retrying..." : "Try Again"}
                </Button>
                <Button
                  onClick={() => router.push('/my-games')}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to My Games
                </Button>
              </div>
            </div>
          </div>
        </div>
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
      <nav className="relative z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center space-x-2 md:space-x-3">
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isHardcoreGame 
                  ? 'bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-500/25' 
                  : 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/25'
              }`}>
                <Gamepad2 className="w-4 h-4 md:w-7 md:h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                  {isHardcoreGame ? "HARDCORE" : "ZEROSUM"}
                </span>
                <div className="text-xs text-slate-400 font-medium">WAITING ROOM</div>
              </div>
            </Link>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 rounded-xl px-2 py-1 md:px-4 md:py-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                  <span className="font-bold text-amber-400 text-xs md:text-sm">
                    <span className="hidden sm:inline">WAITING</span>
                    <span className="sm:hidden">WAIT</span>
                  </span>
                </div>
              </div>
              
              <Button
                onClick={fetchGameData}
                variant="outline"
                size="sm"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-2 md:px-3 text-xs md:text-sm"
                disabled={isPolling}
              >
                <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${isPolling ? 'animate-spin' : ''} ${isPolling ? 'mr-1' : 'mr-1 md:mr-2'}`} />
                <span className="hidden sm:inline">{isPolling ? "Checking..." : "Refresh"}</span>
                <span className="sm:hidden">{isPolling ? "..." : "↻"}</span>
              </Button>
              
              <Button
                onClick={handleCancelBattle}
                variant="outline"
                className="border-rose-600 text-rose-400 hover:bg-rose-600/10 rounded-xl font-bold bg-transparent px-2 md:px-3 text-xs md:text-sm"
                disabled={transactionLoading}
              >
                {transactionLoading ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" />
                ) : (
                  <X className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                )}
                <span className="hidden sm:inline">{transactionLoading ? "CANCELLING..." : "CANCEL BATTLE"}</span>
                <span className="sm:hidden">{transactionLoading ? "..." : "CANCEL"}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative  max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <config.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{config.title}</CardTitle>
                      <p className="text-slate-300 font-medium text-sm sm:text-base">Battle #{gameData.gameId}</p>
                      <p className="text-slate-400 text-xs sm:text-sm">
                        Last checked: {lastCheckTime || "Just now"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-sm sm:text-lg px-3 py-2 sm:px-4">
                    <span className="hidden sm:inline">WAITING FOR OPPONENT</span>
                    <span className="sm:hidden">WAITING</span>
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Battle Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                  BATTLE DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Coins className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-300 font-medium">Entry Fee</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400">
                      {parseFloat(gameData.entryFee).toFixed(4)} MNT
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trophy className="w-5 h-5 text-cyan-400" />
                      <span className="text-slate-300 font-medium">Prize Pool</span>
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      {(parseFloat(gameData.entryFee) * 2).toFixed(4)} MNT
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="w-5 h-5 text-violet-400" />
                      <span className="text-slate-300 font-medium">Players</span>
                    </div>
                    <div className="text-2xl font-black text-violet-400">{players.length}/2</div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span className="text-slate-300 font-medium">Est. Duration</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{config.avgDuration}</div>
                  </div>
                </div>

                {/* Battle Rules */}
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-600/50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-cyan-400" />
                    Battle Rules
                  </h4>
                  <p className="text-slate-300 mb-3">{config.rules}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-slate-400">Difficulty: <span className="text-amber-400 font-bold">{config.difficulty}</span></span>
                    <span className="text-slate-400">Created by: <span className="text-emerald-400 font-bold">You</span></span>
                  </div>
                </div>

                {/* Player Info */}
                <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-emerald-400" />
                    Players ({players.length}/2)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <span className="text-white font-bold">You (Creator)</span>
                      </div>
                      <span className="text-emerald-400 text-sm font-mono">
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border-2 border-dashed border-amber-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                        <span className="text-amber-400 font-bold">Waiting for opponent...</span>
                      </div>
                      <span className="text-slate-400 text-sm">Share link to invite</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Battle */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Share2 className="w-6 h-6 mr-3 text-emerald-400" />
                  INVITE OPPONENT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  Share this battle link with friends or post it on social media to find an opponent!
                </p>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-slate-700/50 border-slate-600 text-white text-xs sm:text-sm"
                  />
                  <div className="flex space-x-2 sm:space-x-3">
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-none"
                    >
                      <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Copy</span>
                    </Button>
                    <Button
                      onClick={handleShareBattle}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex-1 sm:flex-none"
                    >
                      <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Share</span>
                    </Button>
                  </div>
                </div>
                
                {/* Auto-polling status */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    {isPolling ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                    <span className="text-blue-400 text-sm font-medium">
                      {isPolling ? "Checking for opponent..." : "Auto-checking every 15 seconds"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Status Card */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-amber-400" />
                  BATTLE STATUS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    {isPolling ? (
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    ) : (
                      <Clock className="w-8 h-8 text-amber-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Waiting for Opponent</h3>
                  <p className="text-slate-400 text-sm">
                    {isPolling ? "Checking for new players..." : "Share the battle link to find an opponent"}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creator:</span>
                    <span className="text-emerald-400 font-bold">You</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opponent:</span>
                    <span className="text-amber-400 font-bold">Waiting...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-amber-400 font-bold">Open</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Game ID:</span>
                    <span className="text-white font-bold">#{gameData.gameId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">WALLET STATUS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400">CONNECTED ADDRESS</p>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="font-mono text-cyan-400 text-xs break-all">
                    {address}
                  </p>
                </div>
                
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-400 mb-1">GAME BALANCE</p>
                  <p className="font-black text-emerald-400">{parseFloat(userBalance).toFixed(4)} MNT</p>
                </div>

                {parseFloat(userBalance) > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-emerald-400 mb-1">AVAILABLE TO WITHDRAW</p>
                    <p className="font-black text-emerald-400 mb-2">{parseFloat(userBalance).toFixed(4)} MNT</p>
                    <Button
                      onClick={handleWithdraw}
                      disabled={transactionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      {transactionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Coins className="w-4 h-4 mr-2" />
                      )}
                      {transactionLoading ? "Withdrawing..." : "Withdraw Balance"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleViewBattle}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Battle Page
                </Button>
                
                <Button
                  onClick={() => router.push("/browse")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Swords className="w-4 h-4 mr-2" />
                  Browse Other Battles
                </Button>
                
                <Button
                  onClick={() => router.push("/create")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Create Another Battle
                </Button>
                
                <Button
                  onClick={() => router.push("/my-games")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to My Games
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-white">💡 TIPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>• Share your battle link on Discord, Twitter, or gaming communities</p>
                <p>• The page automatically checks for opponents every 15 seconds</p>
                <p>• You'll be redirected when an opponent joins and the battle starts</p>
                <p>• You can cancel the battle anytime to get your entry fee back</p>
                <p>• Your entry fee is locked in the smart contract until the battle begins or is cancelled</p>
                
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
                  <p className="text-amber-400 font-bold text-xs mb-1">⚡ QUICK START</p>
                  <p className="text-amber-200 text-xs">
                    Copy the battle link and share it directly with a friend for the fastest way to start playing!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}