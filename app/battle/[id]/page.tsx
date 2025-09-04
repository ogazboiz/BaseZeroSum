"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Gamepad2,
  Target,
  Brain,
  Eye,
  Clock,
  Swords,
  Shield,
  AlertTriangle,
  Timer,
  Minus,
  Wallet,
  RefreshCw,
  ArrowLeft,
  Trophy,
  Plus,
  Loader2,
  X
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAccount } from "wagmi"
import { 
  useZeroSumData, 
  useZeroSumContract, 
  GameData, 
  PlayerView, 
  GameStatus, 
  GameMode 
} from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

// Enhanced game state interface
interface EnhancedGameState {
  gameId: number
  mode: "Quick Draw" | "Strategic"
  status: "waiting" | "active" | "completed"
  currentNumber: number
  currentPlayer: string
  winner: string | null
  entryFee: string
  prizePool: string
  players: string[]
  
  // User-specific
  isUserInGame: boolean
  isUserCreator: boolean
  isMyTurn: boolean
  canJoin: boolean
  timeLeft: number
  
  // Enhanced game state
  numberGenerated: boolean
  gameStuck: boolean
  stuckPlayer: string
  yourTimeouts: number
  opponentTimeouts: number
}

function BattlePage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const battleId = params.id as string
  const gameId = battleId ? parseInt(battleId) : null
  
  // Blockchain hooks
  const {
    getGame,
    getPlayers,
    getPlayerView,
    getPlayerBalance,
    contractsReady,
    providerReady
  } = useZeroSumData()
  
  const {
    joinGame,
    makeMove,
    handleTimeout,
    cancelWaitingGame,
    forceFinishInactiveGame,
    withdraw,
    loading: transactionLoading
  } = useZeroSumContract()

  // State management
  const [gameState, setGameState] = useState<EnhancedGameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState("0")
  const [moveAmount, setMoveAmount] = useState("")
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null)
  const [autoReloadCountdown, setAutoReloadCountdown] = useState(90)
  
  // Fetch game data function
  const fetchGameData = useCallback(async () => {
    if (!gameId || !contractsReady) {
      console.log('⏸️ Skipping fetch - requirements not met:', {
        gameId: !!gameId,
        contractsReady
      })
      return
    }

    console.log(`🎮 Fetching data for game ${gameId}`)
    setIsLoading(true)
    setError(null)

    try {
      // Fetch basic game data (works for spectators)
      const [gameData, players] = await Promise.allSettled([
        getGame(gameId),
        getPlayers(gameId)
      ])

      // Extract results with error handling
      const gameDataResult = gameData.status === 'fulfilled' ? gameData.value : null
      const playersResult = players.status === 'fulfilled' ? players.value : []

      // Only fetch balance if user is connected
      let balanceResult = "0"
      if (isConnected && address) {
        try {
          balanceResult = await getPlayerBalance(address)
        } catch (error) {
          console.warn('⚠️ Could not get user balance (spectator mode):', error)
          balanceResult = "0"
        }
      }

      if (!gameDataResult) {
        throw new Error(`Game #${gameId} not found on blockchain`)
      }

      console.log('📊 Raw game data:', gameDataResult)
      console.log('👥 Players:', playersResult)

      // Update user balance
      setUserBalance(balanceResult)

      // Determine user relationship to game
      const isUserInGame = playersResult.some(p => p.toLowerCase() === address.toLowerCase())
      const isUserCreator = playersResult.length > 0 && playersResult[0].toLowerCase() === address.toLowerCase()
      const canJoin = !isUserInGame && playersResult.length < 2 && gameDataResult.status === GameStatus.WAITING

      // Initialize player view data
      let playerViewData: PlayerView | null = null
      let isMyTurn = false
      let timeLeft = 0
      let gameStuck = false
      let stuckPlayer = ""
      let yourTimeouts = 0
      let opponentTimeouts = 0

      // Get enhanced player view for active games (only if user is in the game and connected)
      if (gameDataResult.status === GameStatus.ACTIVE && isUserInGame && isConnected && address) {
        try {
          playerViewData = await getPlayerView(gameId)
          if (playerViewData) {
            isMyTurn = playerViewData.yourTurn
            timeLeft = playerViewData.timeLeft
            gameStuck = playerViewData.gameStuck || false
            stuckPlayer = playerViewData.stuckPlayer || ""
            yourTimeouts = playerViewData.yourTimeouts
            opponentTimeouts = playerViewData.opponentTimeouts
            
            console.log('🎯 Player view data:', {
              yourTurn: isMyTurn,
              timeLeft,
              gameStuck,
              stuckPlayer,
              yourTimeouts,
              opponentTimeouts
            })
          }
        } catch (error) {
          console.warn('⚠️ Could not get player view (might be spectator):', error)
          
          // Fallback: Basic turn detection for spectators
          isMyTurn = isUserInGame && gameDataResult.currentPlayer.toLowerCase() === address.toLowerCase()
          timeLeft = 0 // Can't get time left without player view
        }
      } else {
        // For spectators or disconnected users, just set basic values
        console.log('👁️ Spectator/disconnected mode - skipping player view data')
        isMyTurn = false
        timeLeft = 0
        gameStuck = false
        stuckPlayer = ""
        yourTimeouts = 0
        opponentTimeouts = 0
      }

      // Double-check turn logic for consistency
      const currentPlayerIsMe = gameDataResult.currentPlayer.toLowerCase() === address.toLowerCase()
      console.log('🔍 Turn logic verification:', {
        contractSaysMyTurn: isMyTurn,
        currentPlayerIsMe,
        isUserInGame,
        gameStatus: gameDataResult.status,
        currentPlayer: gameDataResult.currentPlayer
      })

      // Build enhanced game state
      const enhancedState: EnhancedGameState = {
        gameId,
        mode: gameDataResult.mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic",
        status: gameDataResult.status === GameStatus.WAITING ? "waiting" : 
                gameDataResult.status === GameStatus.ACTIVE ? "active" : "completed",
        currentNumber: gameDataResult.currentNumber,
        currentPlayer: gameDataResult.currentPlayer,
        winner: gameDataResult.winner && gameDataResult.winner !== "0x0000000000000000000000000000000000000000" 
                ? gameDataResult.winner : null,
        entryFee: gameDataResult.entryFee,
        prizePool: gameDataResult.prizePool,
        players: playersResult,
        
        isUserInGame,
        isUserCreator,
        isMyTurn: isUserInGame ? currentPlayerIsMe : false, // Always use currentPlayer for turn logic
        canJoin,
        timeLeft,
        
        numberGenerated: gameDataResult.numberGenerated,
        gameStuck,
        stuckPlayer,
        yourTimeouts,
        opponentTimeouts
      }

      setGameState(enhancedState)
      console.log('✅ Enhanced game state:', enhancedState)

    } catch (error) {
      console.error('❌ Error fetching game:', error)
      
      // Check if it's a RangeError (user not in game) - redirect to browse page
      if (error instanceof Error && error.message.includes('out of result range')) {
        console.log('🔄 RangeError detected - redirecting to browse page with game ID')
        router.push(`/browse?highlight=${gameId}`)
        return
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load game data')
      }
    } finally {
      setIsLoading(false)
    }
  }, [gameId, contractsReady, getGame, getPlayers, getPlayerView, getPlayerBalance, isConnected, address])

  // Initial data fetch
  useEffect(() => {
    if (providerReady) {
      fetchGameData()
    }
  }, [providerReady, fetchGameData])

  // Real-time countdown timer
  useEffect(() => {
    if (gameState?.status === "active" && gameState.timeLeft > 0) {
      setLocalTimeLeft(gameState.timeLeft)
      
      const interval = setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev === null || prev <= 0) return 0
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setLocalTimeLeft(null)
    }
  }, [gameState?.status, gameState?.timeLeft])

  // Auto-reload timer - removed to prevent excessive reloading
  // The polling mechanisms in GameContext and useGameState will handle updates
  useEffect(() => {
    // Reset countdown when game becomes active
    if (gameState?.status === "active") {
      // Contract uses 90 seconds timeout
      setAutoReloadCountdown(90)
    } else {
      setAutoReloadCountdown(90)
    }
  }, [gameState?.status])

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getValidMoveRange = () => {
    if (!gameState) return { min: 1, max: 1 }
    
    if (gameState.mode === "Quick Draw") {
      return { min: 1, max: 1 }
    } else {
      // Strategic mode: 10-30% of current number
      const min = Math.max(1, Math.ceil(gameState.currentNumber * 0.1))
      const max = Math.floor(gameState.currentNumber * 0.3)
      
      // Handle edge case for small numbers
      if (max < min) {
        return { min: 1, max: 1 }
      }
      
      return { min, max }
    }
  }

  const isActionAllowed = () => {
    return gameState?.isUserInGame && 
           gameState?.isMyTurn && 
           gameState?.status === "active" && 
           (localTimeLeft ?? gameState?.timeLeft ?? 0) > 0 &&
           !transactionLoading
  }

  const getCurrentTimeLeft = () => {
    return localTimeLeft ?? gameState?.timeLeft ?? 0
  }

  // Action handlers with better error handling
  const handleJoinGame = async () => {
    if (!gameState?.canJoin) {
      toast.error("Cannot join this game")
      return
    }
    
    try {
      const result = await joinGame(gameId!, gameState.entryFee)
      if (result.success) {
        toast.success("Successfully joined the game!")
        // Wait a bit for blockchain confirmation then refresh
        setTimeout(() => {
          fetchGameData()
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to join game:', error)
      toast.error("Failed to join game")
    }
  }

  const handleMakeMove = async (subtraction?: number) => {
    if (!isActionAllowed()) {
      toast.error("Move not allowed at this time")
      return
    }
    
    const move = subtraction ?? parseInt(moveAmount)
    if (!move || move < 1) {
      toast.error("Please enter a valid move")
      return
    }

    const range = getValidMoveRange()
    if (move < range.min || move > range.max) {
      toast.error(`Move must be between ${range.min} and ${range.max}`)
      return
    }

    try {
      const result = await makeMove(gameId!, move)
      if (result.success) {
        const newNumber = gameState!.currentNumber - move
        setMoveAmount("")
        toast.success(`Move submitted: ${gameState!.currentNumber} - ${move} = ${newNumber}`)
        
        // Refresh data after successful move
        setTimeout(() => {
          fetchGameData()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to make move:', error)
      toast.error("Failed to submit move")
    }
  }

  const handleTimeoutAction = async () => {
    if (!gameState) return
    
    try {
      const result = await handleTimeout(gameId!)
      if (result.success) {
        toast.success("Timeout processed successfully!")
        setTimeout(() => {
          fetchGameData()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to handle timeout:', error)
      toast.error("Failed to process timeout")
    }
  }

  const handleCancelGame = async () => {
    if (!gameState?.isUserCreator || gameState?.status !== "waiting") {
      toast.error("Cannot cancel this game")
      return
    }
    
    try {
      const result = await cancelWaitingGame(gameId!)
      if (result.success) {
        toast.success("Game cancelled successfully!")
        setTimeout(() => {
          router.push("/my-games")
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to cancel game:', error)
      toast.error("Failed to cancel game")
    }
  }

  const handleForceFinish = async () => {
    if (!gameState?.gameStuck) {
      toast.error("Game is not stuck")
      return
    }
    
    try {
      const result = await forceFinishInactiveGame(gameId!)
      if (result.success) {
        toast.success("Stuck game finished successfully!")
        setTimeout(() => {
          fetchGameData()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to force finish game:', error)
      toast.error("Failed to force finish game")
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

  // Game mode configuration
  const config = {
    "Quick Draw": {
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    },
    "Strategic": {
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
    },
  }

  const gameConfig = gameState ? config[gameState.mode] : config["Quick Draw"]
  const range = getValidMoveRange()

  // Loading state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400">Please connect your wallet to view this battle</p>
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
            <p className="text-xl font-bold text-white">Loading Battle #{battleId}...</p>
            <p className="text-slate-400">Fetching data from blockchain</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !gameState) {
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
              {error && error.includes('join this game first') ? (
                <>
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Join Game to View
                  </h2>
                  <p className="text-slate-300 mb-6 max-w-md">
                    You need to join this game first to view it. Connect your wallet and join the battle to see the game details.
                  </p>
                  <div className="space-x-3">
                    <Button
                      onClick={() => router.push("/browse")}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6 py-3"
                    >
                      <Swords className="w-4 h-4 mr-2" />
                      Browse Games
                    </Button>
                    <Button
                      onClick={() => router.push("/create")}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 px-6 py-3"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Game
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {error || `Battle #${battleId} Not Found`}
                  </h2>
                  <p className="text-slate-400 mb-4">
                    {error || `Battle #${battleId} doesn't exist or couldn't be loaded`}
                  </p>
                  <div className="space-x-3">
                    <Button
                      onClick={fetchGameData}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      {isLoading ? "Retrying..." : "Try Again"}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <UnifiedGamingNavigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Battle Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${gameConfig.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <gameConfig.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-white">{gameState.mode}</CardTitle>
                      <p className="text-slate-300 font-medium">Battle #{gameState.gameId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={fetchGameData}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      {isLoading ? "Loading..." : "Refresh"}
                    </Button>
                    <Badge
                      className={`${
                        gameState.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : gameState.status === "completed"
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      } font-bold text-lg px-4 py-2`}
                    >
                      {gameState.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Reload Notification */}
            <Card className="bg-amber-500/10 border border-amber-500/30 shadow-lg rounded-2xl">
              <CardContent className="py-4">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-amber-400 font-semibold text-sm">
                      ⚠️ 90s Timer + Manual Refresh Needed
                    </p>
                    <p className="text-amber-300/80 text-xs mt-1">
                      Each player has 90 seconds. You won't see opponent moves until refresh. 
                      Please refresh manually to see updates! (Real-time updates coming in next version)
                    </p>
                  </div>
          
                </div>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-400">CONNECTED WALLET</p>
                      <p className="text-white font-bold">
                        {address?.slice(0, 8)}...{address?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">YOUR ROLE</p>
                      <p className="text-cyan-400 font-bold">
                        {!gameState.isUserInGame ? "Spectator" : 
                         gameState.isUserCreator ? "Creator" : "Player"}
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Game Status Cards */}
            {gameState.status === "waiting" && (
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black text-white flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-amber-400" />
                      WAITING FOR OPPONENT
                    </CardTitle>
                    
                    {gameState.isUserCreator && (
                      <Button
                        onClick={handleCancelGame}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                        disabled={transactionLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Game
                      </Button> 
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="w-24 h-24 bg-amber-500/20 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-12 h-12 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Battle Ready!</h3>
                    <p className="text-slate-300 mb-4">
                      {gameState.isUserCreator 
                        ? "Your battle is waiting for an opponent to join." 
                        : gameState.isUserInGame
                        ? "You're in this game, waiting for the second player to join."
                        : "This battle is waiting for a second player to join."}
                    </p>
                    
                    {/* Player Status */}
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-slate-300 mb-2">Players ({gameState.players.length}/2):</div>
                      <div className="space-y-2">
                        {gameState.players.map((player, index) => (
                          <div key={player} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                {index + 1}
                              </div>
                              <span className="text-slate-200 font-mono text-sm">
                                {player.slice(0, 6)}...{player.slice(-4)}
                                {player.toLowerCase() === address?.toLowerCase() && (
                                  <span className="ml-2 text-cyan-400 text-xs">(You)</span>
                                )}
                                {index === 0 && (
                                  <span className="ml-2 text-amber-400 text-xs">(Creator)</span>
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                        {gameState.players.length === 1 && (
                          <div className="flex items-center text-slate-400 text-sm">
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-slate-400 text-sm font-bold mr-3">
                              ?
                            </div>
                            <span>Waiting for second player...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm">
                      Entry Fee: {parseFloat(gameState.entryFee).toFixed(4)} ETH • Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} ETH
                    </p>
                    
                    {gameState.canJoin && (
                      <div className="mt-6">
                        <Button
                          onClick={handleJoinGame}
                          disabled={transactionLoading}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-xl"
                        >
                          {transactionLoading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Swords className="w-5 h-5 mr-2" />
                          )}
                          {transactionLoading ? "JOINING..." : `JOIN BATTLE (${parseFloat(gameState.entryFee).toFixed(4)} ETH)`}
                        </Button>
                      </div>
                    )}
                    
                    {!gameState.canJoin && !gameState.isUserInGame && (
                      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                        <div className="text-slate-300 text-sm">
                          {gameState.players.length >= 2 ? (
                            <span>This game is full and cannot be joined.</span>
                          ) : (
                            <span>You cannot join this game. Make sure you have enough ETH for the entry fee.</span>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs mt-2">
                          Required: {parseFloat(gameState.entryFee).toFixed(4)} ETH
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Game */}
            {gameState.status === "active" && (
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white flex items-center">
                    <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                    SUBTRACTION BATTLE
                    {gameState.gameStuck && (
                      <Badge className="ml-3 bg-red-500/20 text-red-400 border-red-500/30">
                        STUCK
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Current Number Display */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-center space-x-4 text-4xl font-black">
                      <span className="text-white">{gameState.currentNumber}</span>
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-800/40 rounded-lg">
                      <p className="text-slate-400 text-sm">
                        {gameState.mode === "Quick Draw"
                          ? "Valid move: Subtract exactly 1"
                          : `Valid moves: Subtract between ${range.min} and ${range.max}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Turn Information */}
                  <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 border border-rose-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Timer className={`w-6 h-6 ${getCurrentTimeLeft() < 60 ? "text-rose-400" : "text-cyan-400"}`} />
                        <div>
                          <span className="font-bold text-white text-xl">
                            {gameState.isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-black ${getCurrentTimeLeft() < 10 ? "text-rose-400" : "text-cyan-400"}`}>
                          {formatTime(getCurrentTimeLeft())}
                        </div>
                      </div>
                    </div>
                    
                    <Progress
                      value={(getCurrentTimeLeft() / 90) * 100} // 90 seconds max
                      className={`h-3 ${getCurrentTimeLeft() < 10 ? "bg-rose-900/50" : "bg-slate-800/50"}`}
                    />
                  </div>

                  {/* Game Controls */}
                  <div className={`rounded-xl p-6 border ${
                    isActionAllowed()
                      ? "bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30"
                      : "bg-gradient-to-r from-slate-900/30 to-gray-900/30 border-slate-500/30"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${
                        isActionAllowed() ? "text-cyan-400" : "text-slate-400"
                      }`}>
                        {isActionAllowed() ? "YOUR TURN - MAKE A MOVE" : "GAME CONTROLS"}
                      </h3>
                      <Badge className={
                        isActionAllowed()
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }>
                        {isActionAllowed() ? "ACTIVE PLAYER" : "INACTIVE"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Quick Draw Controls */}
                      {gameState.mode === "Quick Draw" && (
                        <div className="text-center">
                          <div className="mb-2">
                            <p className="text-slate-300 text-sm">Quick Draw Mode: Subtract exactly 1</p>
                          </div>
                          <Button
                            onClick={() => handleMakeMove(1)}
                            disabled={!isActionAllowed()}
                            className={`font-bold px-8 py-4 rounded-xl text-xl w-full ${
                              isActionAllowed()
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-slate-600 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {transactionLoading ? (
                              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            ) : (
                              <Minus className="w-6 h-6 mr-3" />
                            )}
                            {transactionLoading ? "PROCESSING..." : "SUBTRACT 1"}
                          </Button>
                        </div>
                      )}
                      
                      {/* Strategic Mode Controls */}
                      {gameState.mode === "Strategic" && (
                        <div className="space-y-3">
                          <p className="text-slate-300 text-center font-medium">
                            Strategic Mode: Choose amount to subtract ({range.min} - {range.max})
                          </p>
                          {range.min === range.max && range.min === 1 && (
                            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2 text-center">
                              <p className="text-amber-400 text-sm">
                                ⚠️ Number too small for percentage moves. Only subtract 1 allowed.
                              </p>
                            </div>
                          )}
                        
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <Button
                              onClick={() => setMoveAmount(range.min.toString())}
                              variant="outline"
                              size="sm"
                              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              Min ({range.min})
                            </Button>
                            <Button
                              onClick={() => setMoveAmount(Math.floor((range.min + range.max) / 2).toString())}
                              variant="outline"
                              size="sm"
                              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              Mid ({Math.floor((range.min + range.max) / 2)})
                            </Button>
                            <Button
                              onClick={() => setMoveAmount(range.max.toString())}
                              variant="outline"
                              size="sm"
                              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              Max ({range.max})
                            </Button>
                          </div>
                          
                          <div className="flex space-x-3">
                            <Input
                              type="number"
                              value={moveAmount}
                              onChange={(e) => setMoveAmount(e.target.value)}
                              placeholder={`Enter ${range.min}-${range.max}`}
                              className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl text-lg font-bold flex-1"
                              min={range.min}
                              max={range.max}
                            />
                            <Button
                              onClick={() => handleMakeMove()}
                              disabled={!moveAmount || !isActionAllowed()}
                              className={`font-bold px-8 py-4 rounded-xl ${
                                isActionAllowed()
                                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                                  : "bg-slate-600 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {transactionLoading ? (
                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                              ) : (
                                <Swords className="w-6 h-6 mr-2" />
                              )}
                              {transactionLoading ? "PROCESSING..." : "SUBMIT MOVE"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Messages */}
                    <div className="mt-4 text-center space-y-2">
                      {!gameState.isUserInGame && (
                        <p className="text-amber-400 text-sm">👁️ You are spectating this game</p>
                      )}
                      {gameState.isUserInGame && !gameState.isMyTurn && (
                        <p className="text-yellow-400 text-sm">⏳ Waiting for opponent's move</p>
                      )}
                      {gameState.isUserInGame && gameState.isMyTurn && getCurrentTimeLeft() <= 0 && (
                        <p className="text-red-400 text-sm">⏰ Your time has expired!</p>
                      )}
                      {gameState.isUserInGame && gameState.isMyTurn && getCurrentTimeLeft() > 0 && (
                        <p className="text-green-400 text-sm">✅ It's your turn - make your move!</p>
                      )}
                    </div>
                  </div>

                  {/* Timeout Handling */}
                  {getCurrentTimeLeft() === 0 && gameState.status === "active" && (
                    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <div>
                          <span className="font-bold text-red-400 text-xl">⏰ TIME EXPIRED!</span>
                          <p className="text-sm text-red-300">
                            {gameState.isMyTurn ? "Your time expired" : "Opponent's time expired"}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleTimeoutAction}
                        disabled={transactionLoading}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold"
                      >
                        {transactionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4 mr-2" />
                        )}
                        {transactionLoading ? "PROCESSING..." : 
                         gameState.isMyTurn ? "Accept My Timeout" : "Claim Opponent Timeout"}
                      </Button>
                    </div>
                  )}

                  {/* Stuck Game Handling */}
                  {gameState.gameStuck && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        <div>
                          <span className="font-bold text-orange-400 text-xl">🔄 GAME STUCK!</span>
                          <p className="text-sm text-orange-300">
                            This game has been inactive for over an hour. Anyone can force finish it.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleForceFinish}
                        disabled={transactionLoading}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                      >
                        {transactionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-2" />
                        )}
                        {transactionLoading ? "PROCESSING..." : "Force Finish Game"}
                      </Button>
                    </div>
                  )}

                  {/* Spectator View */}
                  {!gameState.isUserInGame && (
                    <div className="bg-gradient-to-r from-slate-900/30 to-gray-900/30 border border-slate-500/30 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-400 text-xl">SPECTATOR MODE</h3>
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          WATCHING
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 text-center mb-4">
                        You are watching this battle as a spectator. 
                        <br />
                        Current player: {gameState.currentPlayer === gameState.players[0] ? 
                          `${gameState.players[0]?.slice(0, 8)}... (Creator)` : 
                          `${gameState.players[1]?.slice(0, 8)}... (Opponent)`}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-800/40 rounded p-2">
                          <span className="text-slate-400">Creator Timeouts:</span>
                          <span className="text-white ml-2">{gameState.yourTimeouts}/2</span>
                        </div>
                        <div className="bg-slate-800/40 rounded p-2">
                          <span className="text-slate-400">Opponent Timeouts:</span>
                          <span className="text-white ml-2">{gameState.opponentTimeouts}/2</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Completed Game */}
            {gameState.status === "completed" && (
              <Card className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white flex items-center">
                    <Trophy className="w-6 h-6 mr-3 text-violet-400" />
                    BATTLE COMPLETED
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="w-24 h-24 bg-violet-500/20 border-2 border-violet-500/30 rounded-full flex items-center justify-center mx-auto">
                    {gameState.winner?.toLowerCase() === address?.toLowerCase() ? (
                      <Trophy className="w-12 h-12 text-emerald-400" />
                    ) : (
                      <Shield className="w-12 h-12 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {gameState.winner?.toLowerCase() === address?.toLowerCase() ? "🎉 VICTORY!" : "Battle Ended"}
                    </h3>
                    <p className="text-slate-300 mb-4">
                      Winner: {gameState.winner?.toLowerCase() === address?.toLowerCase() ? "You" : 
                               gameState.winner?.toLowerCase() === gameState.players[0]?.toLowerCase() ? 
                               `${gameState.players[0]?.slice(0, 8)}... (Creator)` : 
                               `${gameState.players[1]?.slice(0, 8)}... (Opponent)`}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Final number: {gameState.currentNumber} • Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} ETH
                    </p>
                  </div>
                  
                  <div className="space-x-3">
                    <Button
                      onClick={() => router.push("/create")}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-2 rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Battle
                    </Button>
                    <Button
                      onClick={() => router.push("/browse")}
                      variant="outline"
                      className="border-slate-600 text-white hover:bg-slate-800/50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Browse Battles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Battle Details */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">BATTLE INFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">ENTRY FEE</p>
                    <p className="font-black text-cyan-400">{parseFloat(gameState.entryFee).toFixed(4)} ETH</p>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
                    <p className="font-black text-emerald-400">{parseFloat(gameState.prizePool).toFixed(4)} ETH</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creator:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {gameState.players[0] ? `${gameState.players[0].slice(0, 6)}...${gameState.players[0].slice(-4)}` : "Loading..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opponent:</span>
                    <span className="font-bold text-violet-400 text-sm">
                      {gameState.players[1] ? `${gameState.players[1].slice(0, 6)}...${gameState.players[1].slice(-4)}` : "Waiting..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Player:</span>
                    <span className="font-bold text-cyan-400 text-sm">
                      {gameState.currentPlayer ? `${gameState.currentPlayer.slice(0, 6)}...${gameState.currentPlayer.slice(-4)}` : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Number:</span>
                    <span className="font-bold text-white">{gameState.currentNumber}</span>
                  </div>
                  {gameState.status === "active" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time Left:</span>
                      <span className={`font-bold ${getCurrentTimeLeft() < 10 ? "text-rose-400" : "text-amber-400"}`}>
                        {formatTime(getCurrentTimeLeft())}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Your Role:</span>
                    <span className="font-bold text-white">
                      {!gameState.isUserInGame ? "Spectator" : 
                       gameState.isUserCreator ? "Creator" : "Player"}
                    </span>
                  </div>
                  {gameState.status === "active" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Your Timeouts:</span>
                        <span className="font-bold text-yellow-400">{gameState.yourTimeouts}/2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Opp. Timeouts:</span>
                        <span className="font-bold text-yellow-400">{gameState.opponentTimeouts}/2</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">GAME RULES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-400 mb-1">MODE</p>
                  <p className="font-bold text-white">{gameState.mode}</p>
                </div>
                
                <div className="text-sm text-slate-300 space-y-2">
                  <p className="font-bold text-white">How to play:</p>
                  {gameState.mode === "Quick Draw" ? (
                    <div className="space-y-1">
                      <p>• Players take turns subtracting exactly 1</p>
                      <p>• First player to reach 0 WINS</p>
                      <p>• 90 seconds per turn</p>
                      <p>• 2 timeouts allowed per player</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>• Subtract 10-30% of current number</p>
                      <p>• DON'T reach 0 or you LOSE</p>
                      <p>• Force opponent to reach 0</p>
                      <p>• 90 seconds per turn</p>
                      <p>• 2 timeouts allowed per player</p>
                    </div>
                  )}
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
                        <p className="font-black text-emerald-400">{parseFloat(userBalance).toFixed(4)} ETH</p>
                    <Button
                      onClick={handleWithdraw}
                      disabled={transactionLoading}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      {transactionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
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
                  onClick={fetchGameData}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? "Refreshing..." : "Refresh Game"}
                </Button>
                
                <Button
                  onClick={() => router.push("/my-games")}
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-800/50 rounded-lg"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  My Games
                </Button>
                
                <Button
                  onClick={() => router.push("/browse")}
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-800/50 rounded-lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse Battles
                </Button>
                
                <Button
                  onClick={() => router.push("/create")}
                  variant="outline"
                  className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Battle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export with dynamic import to prevent SSR hydration issues
export default dynamic(() => Promise.resolve(BattlePage), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
          <p className="text-xl font-bold text-white">Loading Battle...</p>
          <p className="text-slate-400">Preparing game interface</p>
        </div>
      </div>
    </div>
  )
})