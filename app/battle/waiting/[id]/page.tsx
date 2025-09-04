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
  Trophy
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAccount } from "wagmi"
import { 
  useZeroSumData, 
  useZeroSumContract,
  GameData,
  GameStatus,
  GameMode
} from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { getWaitingRoomUrl } from "@/utils/farcaster"

export default function UpdatedWaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const battleId = params.id as string
  const gameId = battleId ? parseInt(battleId) : null

  // Blockchain hooks
  const {
    getGame,
    getPlayers,
    getPlayerBalance,
    contractsReady,
    providerReady
  } = useZeroSumData()
  
  const {
    cancelWaitingGame,
    withdraw,
    loading: transactionLoading
  } = useZeroSumContract()

  // State management
  const [gameData, setGameData] = useState<GameData | null>(null)
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
      // Fetch game data first
      const game = await getGame(gameId)
      
      if (!game) {
        throw new Error(`Game #${gameId} not found`)
      }

      // Then fetch players and balance with error handling
      let gamePlayers: string[] = []
      let balance = "0"
      
      try {
        gamePlayers = await getPlayers(gameId)
        console.log('👥 Players fetched:', gamePlayers)
      } catch (playerError) {
        console.warn('⚠️ Failed to fetch players, continuing with empty array:', playerError)
        gamePlayers = []
      }
      
      try {
        balance = await getPlayerBalance(address)
        console.log('💰 Balance fetched:', balance)
      } catch (balanceError) {
        console.warn('⚠️ Failed to fetch balance, using default:', balanceError)
        balance = "0"
      }

      console.log('📊 Game data:', game)
      console.log('👥 Players:', gamePlayers)

      // Check if user is the creator
      console.log('🔍 Creator check:')
      console.log('👤 User address:', address)
      console.log('👥 Game players:', gamePlayers)
      console.log('🎯 First player (creator):', gamePlayers[0])
      
      const isUserCreator = gamePlayers.length > 0 && 
                           gamePlayers[0].toLowerCase() === address.toLowerCase()
      
      console.log('✅ Is user creator?', isUserCreator)

      // If we can't determine the creator (players array is empty), 
      // but the game exists and is in WAITING status, show the waiting room anyway
      if (!isUserCreator && gamePlayers.length === 0) {
        console.log('⚠️ Cannot determine creator (no players data), but game exists - showing waiting room')
        // Don't redirect, continue to show waiting room
      } else if (!isUserCreator && gamePlayers.length > 0) {
        // User is definitely not the creator, but check if game has started
        if (game.status === GameStatus.WAITING) {
          // Game is still waiting, user can join as opponent
          console.log('🎮 Game is waiting, user can join as opponent - redirecting to battle page')
          router.push(`/battle/${gameId}`)
          return
        } else {
          // Game has started, user can spectate
          console.log('🎮 Game has started, user can spectate - redirecting to battle page')
          router.push(`/battle/${gameId}`)
          return
        }
      }

      // Check if game has started (opponent joined)
      if (game.status !== GameStatus.WAITING) {
        console.log('🎮 Game has started, redirecting to battle page')
        toast.success("Opponent joined! Battle starting...")
        router.push(`/battle/${gameId}`)
        return
      }

      setGameData(game)
      setPlayers(gamePlayers)
      setUserBalance(balance)
      setLastCheckTime(new Date().toLocaleTimeString())

    } catch (error) {
      console.error('❌ Error fetching game data:', error)
      
      // Check if it's a RangeError (user not in game) - redirect to browse page
      if (error instanceof Error && error.message.includes('out of result range')) {
        console.log('🔄 RangeError detected in waiting room - redirecting to browse page with game ID')
        router.push(`/browse?highlight=${gameId}`)
        return
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load game data')
      }
    } finally {
      setIsPolling(false)
    }
  }, [gameId, isConnected, address, contractsReady, getGame, getPlayers, getPlayerBalance, router])

  // Initial data fetch with delay for new games
  useEffect(() => {
    if (gameId && isConnected && address && providerReady) {
      // Add a small delay for newly created games to be indexed
      const timer = setTimeout(() => {
        console.log(`🕐 Fetching game data after delay for game ${gameId}`)
        setIsLoading(true)
        fetchGameData().finally(() => setIsLoading(false))
      }, 2000) // 2 second delay
      
      return () => clearTimeout(timer)
    }
  }, [gameId, isConnected, address, providerReady, fetchGameData])

  // Set share URL - redirect to browse page with highlighting
  useEffect(() => {
    if (typeof window !== 'undefined' && gameId) {
      const url = `${getWaitingRoomUrl(gameId)}`
      setShareUrl(url)
    }
  }, [gameId])

  // Polling for opponent joining
  useEffect(() => {
    if (!gameData || gameData.status !== GameStatus.WAITING) return

    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for opponent...')
      fetchGameData()
    }, 15000) // Check every 15 seconds

    return () => clearInterval(pollInterval)
  }, [gameData?.status, fetchGameData])

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
        await navigator.share({
          title: `Join my ${gameModeConfigs[gameData.mode].title} battle!`,
          text: `I've created a ${gameModeConfigs[gameData.mode].title} battle with ${gameData.entryFee} ETH entry fee. Join me!`,
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
      router.push(`/battle/${gameId}`)
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

  // Get game config
  const config = gameData ? gameModeConfigs[gameData.mode] : gameModeConfigs[GameMode.QUICK_DRAW]

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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="text-xs text-slate-400 font-medium">WAITING ROOM</div>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400">WAITING</span>
                </div>
              </div>
              
              <Button
                onClick={fetchGameData}
                variant="outline"
                size="sm"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                disabled={isPolling}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                {isPolling ? "Checking..." : "Refresh"}
              </Button>
              
              <Button
                onClick={handleCancelBattle}
                variant="outline"
                className="border-rose-600 text-rose-400 hover:bg-rose-600/10 rounded-xl font-bold bg-transparent"
                disabled={transactionLoading}
              >
                {transactionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                {transactionLoading ? "CANCELLING..." : "CANCEL BATTLE"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <config.icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl font-black text-white">{config.title}</CardTitle>
                      <p className="text-slate-300 font-medium">Battle #{gameData.gameId}</p>
                      <p className="text-slate-400 text-sm">
                        Last checked: {lastCheckTime || "Just now"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-lg px-4 py-2">
                    WAITING FOR OPPONENT
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
                      {parseFloat(gameData.entryFee).toFixed(4)} ETH
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trophy className="w-5 h-5 text-cyan-400" />
                      <span className="text-slate-300 font-medium">Prize Pool</span>
                    </div>
                    <div className="text-2xl font-black text-cyan-400">
                      {parseFloat(gameData.prizePool).toFixed(4)} ETH
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
                    Players ({players.length > 0 ? players.length : 1}/2)
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
                  
                  {/* Info about spectating */}
                  <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">
                      <strong>💡 Note:</strong> Once an opponent joins, you'll be redirected to the battle page. 
                      Spectators can watch after both players have joined.
                    </p>
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
                
                <div className="flex space-x-3">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={handleShareBattle}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
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
          <div className="lg:col-span-1 space-y-6">
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
                  <p className="font-black text-emerald-400">{parseFloat(userBalance).toFixed(4)} ETH</p>
                </div>

                {parseFloat(userBalance) > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-emerald-400 mb-1">AVAILABLE TO WITHDRAW</p>
                    <p className="font-black text-emerald-400 mb-2">{parseFloat(userBalance).toFixed(4)} ETH</p>
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