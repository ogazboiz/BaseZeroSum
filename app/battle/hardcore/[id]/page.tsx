"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
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
  X,
  Coins,
  TrendingUp,
  Users
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { useAccount } from "wagmi"
import { 
  useHardcoreMysteryData, 
  useHardcoreMysteryContract, 
  GameMode, 
  GameStatus 
} from "@/hooks/useHardcoreMysteryContracts"
import { useHardcoreMysterySpectator, GameContract, useSpectatorData } from "@/hooks/useSpectatorContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

// Enhanced game state interface matching the battle page pattern
interface EnhancedGameState {
  gameId: number
  mode: "Hardcore Mystery" | "Last Stand"
  status: "waiting" | "active" | "completed"
  currentNumber: number
  currentPlayer: string
  winner: string | null
  entryFee: string
  prizePool: string
  players: string[]
  maxPlayers: number
  
  // User-specific
  isUserInGame: boolean
  isUserCreator: boolean
  isMyTurn: boolean
  canJoin: boolean
  timeLeft: number
  
  // Enhanced game state
  moveCount: number
  gameStuck: boolean
  stuckPlayer: string
  
  // Last Stand specific
  activePlayers: string[]
  eliminatedPlayers: string[]
}

export default function HardcoreBattlePage() {
  const params = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const battleId = params.id as string
  const gameId = battleId ? parseInt(battleId) : null
  
  // Hook functions - these are stable
  const {
    getGame,
    getPlayers,
    getActivePlayers,
    isGameBettable,
    getPlayerView,
    contractsReady,
    providerReady
  } = useHardcoreMysteryData()
  
  const {
    joinGame,
    makeMove,
    loading: transactionLoading,
    handleTimeout
  } = useHardcoreMysteryContract()

  // Spectator betting hooks
  const {
    placeBet,
    claimBettingWinnings,
    withdrawSpectatorBalance,
    loading: bettingLoading
  } = useHardcoreMysterySpectator()

  // ✅ NEW: Enhanced spectator data hooks for real contract data
  const {
    hasUserBetOnGame,
    getUserBetInfo,
    getBettingInfo,
    isBettingAllowed
  } = useSpectatorData()

  // State management
  const [gameState, setGameState] = useState<EnhancedGameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moveAmount, setMoveAmount] = useState("")
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(0)
  
  // Betting state
  const [betAmount, setBetAmount] = useState("0.01")
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [userBet, setUserBet] = useState<{
    amount: string
    player: string
    placed: boolean
    predictedWinner: string
    claimed: boolean
    timestamp: number
  } | null>(null)
  
  // ✅ NEW: Enhanced betting state for real contract data
  const [userBetStatus, setUserBetStatus] = useState<{
    hasBet: boolean
    canBet: boolean
    bettingAllowed: boolean
  }>({
    hasBet: false,
    canBet: false,
    bettingAllowed: false
  })
  
  // ✅ NEW: Game betting info from contract
  const [bettingInfo, setBettingInfo] = useState<{
    totalBetAmount: string
    numberOfBets: number
    bettingAllowed: boolean
  } | null>(null)
  
  // Add ref to prevent intervals from running when component is unmounting
  const isMountedRef = useRef(true)
  // Add ref to track if initial fetch has been done
  const initialFetchDoneRef = useRef(false)

  // Game configuration based on mode
  const gameConfig = useMemo(() => {
    if (gameState?.mode === "Last Stand") {
      return {
        icon: Users,
        gradient: "from-orange-400 via-red-500 to-pink-600",
        bgGradient: "from-orange-900/20 to-red-900/20"
      }
    } else {
      return {
        icon: Coins,
        gradient: "from-rose-400 via-pink-500 to-red-600",
        bgGradient: "from-rose-900/20 to-rose-900/20"
      }
    }
  }, [gameState?.mode])

  // ✅ CRITICAL FIX: Completely stable fetchGameData function
  const fetchGameData = useCallback(async () => {
    if (!gameId || !contractsReady) {
      console.log('❌ fetchGameData early return:', { gameId, contractsReady })
      return
    }
    
    // Prevent multiple simultaneous fetches
    if (isLoading && initialFetchDoneRef.current) {
      console.log('⏸️ Fetch already in progress, skipping...')
      return
    }
    
    try {
      console.log('🎯 fetchGameData called')
      setIsLoading(true)
      setError(null)
      
             // Fetch game data
       const [game, players, bettable, activePlayers] = await Promise.all([
         getGame(gameId),
         getPlayers(gameId),
         isGameBettable(gameId),
         getActivePlayers(gameId)
       ])
      
      console.log('🎮 Hardcore Mystery game data:', { game, players, bettable })
      
      if (!game) {
        setError('Game not found')
        return
      }

             // Calculate game state
       const isUserInGame = isConnected && address && players.some((p: string) => p.toLowerCase() === address.toLowerCase())
       const isUserCreator = isConnected && address && players.length > 0 && players[0].toLowerCase() === address.toLowerCase()
       const canJoin = game.status === GameStatus.WAITING && 
                      players.length < game.maxPlayers && 
                      !isUserInGame
       const isMyTurn = isUserInGame && game.currentPlayer.toLowerCase() === address?.toLowerCase()
       
       // Calculate eliminated players for Last Stand mode
       let eliminatedPlayers: string[] = []
       if (game.mode === GameMode.LAST_STAND && game.status === GameStatus.ACTIVE) {
         // Find players who are in the original list but not in active players
         eliminatedPlayers = players.filter(player => 
           !activePlayers.some(activePlayer => activePlayer.toLowerCase() === player.toLowerCase())
         )
       }
      
      // Get actual time remaining from contract using getPlayerView
      let timeLeft = 0
      if (game.status === GameStatus.ACTIVE) {
        try {
          const playerView = await getPlayerView(gameId)
          if (playerView && playerView.timeLeft >= 0) {
            timeLeft = playerView.timeLeft
            console.log('⏰ Using player view time:', timeLeft)
          } else {
            timeLeft = 90
            console.log('⏰ Using fallback time:', timeLeft)
          }
        } catch (error) {
          console.error('Error getting time data:', error)
          timeLeft = 90
          console.log('⏰ Using hardcoded 90s fallback')
        }
      }

      // Map status to match battle page pattern
      let status: "waiting" | "active" | "completed"
      switch (game.status) {
        case GameStatus.WAITING:
          status = "waiting"
          break
        case GameStatus.ACTIVE:
          status = "active"
          break
        case GameStatus.FINISHED:
          status = "completed"
          break
        default:
          status = "waiting"
      }

      // Map mode to display name
      let mode: "Hardcore Mystery" | "Last Stand"
      switch (game.mode) {
        case GameMode.HARDCORE_MYSTERY:
          mode = "Hardcore Mystery"
          break
        case GameMode.LAST_STAND:
          mode = "Last Stand"
          break
        default:
          mode = "Hardcore Mystery"
      }

             const enhancedState: EnhancedGameState = {
         gameId: game.gameId,
         mode,
         status,
         currentNumber: game.actualNumber, // Always 0 for Hardcore Mystery
         currentPlayer: game.currentPlayer,
         winner: game.winner && game.winner !== "0x0000000000000000000000000000000000000000" 
                 ? game.winner : null,
         entryFee: game.entryFee,
         prizePool: game.mode === GameMode.LAST_STAND 
                    ? (parseFloat(game.entryFee) * game.maxPlayers).toString()
                    : (parseFloat(game.entryFee) * 2).toString(),
         players,
         maxPlayers: game.maxPlayers,
         
         isUserInGame: isUserInGame || false,
         isUserCreator: isUserCreator || false,
         isMyTurn: isMyTurn || false,
         canJoin: canJoin || false,
         timeLeft,
         
         moveCount: game.moveCount,
         gameStuck: false,
         stuckPlayer: "",
         
         // Last Stand specific
         activePlayers: activePlayers || [],
         eliminatedPlayers: eliminatedPlayers || []
       }

      setGameState(enhancedState)
      initialFetchDoneRef.current = true
      console.log('✅ Game state updated successfully')

      // ✅ NEW: Fetch betting data from smart contract
      try {
        if (isConnected && address) {
          // Check if user has bet on this game
          const hasBet = await hasUserBetOnGame(GameContract.HARDCORE_MYSTERY, gameId, address)
          
          if (hasBet) {
            // Get detailed bet information
            const betInfo = await getUserBetInfo(GameContract.HARDCORE_MYSTERY, gameId, address)
            if (betInfo) {
              setUserBet({
                amount: betInfo.amount,
                player: betInfo.predictedWinner,
                placed: true,
                predictedWinner: betInfo.predictedWinner,
                claimed: betInfo.claimed,
                timestamp: betInfo.timestamp
              })
            }
          } else {
            setUserBet(null)
          }
          
          // Check if user can bet on this game
          const canBet = await isBettingAllowed(GameContract.HARDCORE_MYSTERY, gameId)
          const isUserInGame = players.some(p => p.toLowerCase() === address.toLowerCase())
          
          setUserBetStatus({
            hasBet,
            canBet: canBet && !isUserInGame,
            bettingAllowed: canBet
          })
        }
        
        // Get general betting info for the game
        const gameBettingInfo = await getBettingInfo(GameContract.HARDCORE_MYSTERY, gameId)
        if (gameBettingInfo) {
          setBettingInfo(gameBettingInfo)
        }
      } catch (error) {
        console.log('Could not fetch betting info from contract:', error)
      }

    } catch (error) {
      console.error('❌ Error fetching game:', error)
      setError(error instanceof Error ? error.message : 'Failed to load game data')
    } finally {
      setIsLoading(false)
    }
     }, [gameId, contractsReady, isConnected, address, getGame, getPlayers, getActivePlayers, isGameBettable, getPlayerView, hasUserBetOnGame, getUserBetInfo, isBettingAllowed])

  // ✅ FIXED: Manual refresh function that doesn't create dependency loops
  const manualRefresh = useCallback(async () => {
    const now = Date.now()
    if (now - lastRefreshTime < 2000) {
      console.log('⏸️ Debounced refresh - too soon')
      return
    }
    
    setLastRefreshTime(now)
    console.log('🔄 Manual refresh triggered')
    await fetchGameData()
  }, [lastRefreshTime, fetchGameData])

  // ✅ FIXED: Initial data fetch - ONLY runs once when conditions are met
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (providerReady && gameId && contractsReady && !initialFetchDoneRef.current) {
      console.log('✅ Conditions met for initial fetch')
      // Add small delay to ensure everything is ready
      timeoutId = setTimeout(() => {
        if (isMountedRef.current && !initialFetchDoneRef.current) {
          fetchGameData()
        }
      }, 100)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [providerReady, gameId, contractsReady, fetchGameData])

  // ✅ FIXED: Wallet address change - only update user role detection, no full refresh
  useEffect(() => {
    if (gameState && address) {
      console.log('👤 Wallet address changed, updating user role detection...', address)
      
      // Recalculate user-specific state without fetching new data
      const isUserInGame = isConnected && address && gameState.players.some((p: string) => p.toLowerCase() === address.toLowerCase())
      const isUserCreator = isConnected && address && gameState.players.length > 0 && gameState.players[0].toLowerCase() === address.toLowerCase()
      const canJoin = gameState.status === "waiting" && 
                     gameState.players.length < gameState.maxPlayers && 
                     !isUserInGame
      const isMyTurn = isUserInGame && gameState.currentPlayer.toLowerCase() === address?.toLowerCase()
      
      // Only update the user-specific fields without triggering a full refresh
      setGameState(prev => prev ? {
        ...prev,
        isUserInGame,
        isUserCreator,
        isMyTurn,
        canJoin
      } : null)
      
      console.log('✅ User role updated:', { isUserInGame, isUserCreator, isMyTurn, canJoin })
    }
  }, [address, isConnected, gameState?.players, gameState?.status, gameState?.maxPlayers, gameState?.currentPlayer])

  // ✅ FIXED: Real-time countdown timer with stable dependencies
  useEffect(() => {
    if (gameState?.status === "active" && gameState.timeLeft > 0) {
      console.log('⏰ Starting countdown with time:', gameState.timeLeft)
      // Only set localTimeLeft if it's null (first time) or if the difference is significant
      setLocalTimeLeft(prev => {
        if (prev === null) {
          return gameState.timeLeft
        }
        // Only update if there's a significant difference (more than 2 seconds)
        // This prevents timer resets during normal countdown
        if (Math.abs(prev - gameState.timeLeft) > 2) {
          return gameState.timeLeft
        }
        return prev
      })
      
      const interval = setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setLocalTimeLeft(null)
    }
  }, [gameState?.status, gameState?.timeLeft])

  // ✅ FIXED: Time sync - much less frequent and only for active games
  useEffect(() => {
    if (gameState?.status === "active" && contractsReady && gameId) {
      // Only sync time every 10 seconds to reduce API calls
      const interval = setInterval(async () => {
        if (!isMountedRef.current) return
        
        try {
          const playerView = await getPlayerView(gameId)
          const contractTime = playerView?.timeLeft || 0
          const currentDisplayTime = localTimeLeft ?? gameState.timeLeft
          
          // Only update if there's a significant difference (>10 seconds)
          if (Math.abs(contractTime - currentDisplayTime) > 10) {
            console.log('⏰ Major time difference detected, updating')
            setGameState(prev => prev ? { 
              ...prev, 
              timeLeft: contractTime,
              isMyTurn: isConnected && address && playerView ? 
                playerView.yourTurn && prev.currentPlayer.toLowerCase() === address.toLowerCase() : 
                prev.isMyTurn
            } : null)
            setLocalTimeLeft(contractTime)
          }
        } catch (error) {
          console.error('⏰ Error syncing time:', error)
        }
      }, 10000) // Sync every 10 seconds instead of 5
      
      return () => clearInterval(interval)
    }
  }, [gameState?.status, contractsReady, gameId, gameState?.timeLeft, localTimeLeft, isConnected, address, getPlayerView])

  // ✅ REMOVED: The periodic refresh effect that was causing auto-refreshing
  // This was the main cause of the constant refreshing

  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      console.log('🧹 Component unmounting')
      isMountedRef.current = false
      initialFetchDoneRef.current = false
      setGameState(null)
      setIsLoading(false)
      setError(null)
      setLocalTimeLeft(null)
    }
  }, [])

  // Helper functions
  const getCurrentTimeLeft = useCallback(() => {
    const time = localTimeLeft ?? gameState?.timeLeft ?? 0
    return Math.max(0, time)
  }, [localTimeLeft, gameState?.timeLeft])

  const isActionAllowed = useCallback(() => {
    const timeLeft = getCurrentTimeLeft()
    const allowed = gameState?.isUserInGame && 
           gameState?.isMyTurn && 
           gameState?.status === "active" && 
           timeLeft > 0 &&
           !transactionLoading

    return allowed
  }, [gameState?.isUserInGame, gameState?.isMyTurn, gameState?.status, getCurrentTimeLeft, transactionLoading])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Betting functions
  const handlePlaceBet = async (playerAddress: string) => {
    if (!gameId || !betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount")
      return
    }

    if (!selectedPlayer) {
      toast.error("Please select a player to bet on")
      return
    }

    try {
      const result = await placeBet(gameId, playerAddress, betAmount)
      
      if (result.success) {
        toast.success(`Bet placed successfully! ${betAmount} MNT on ${playerAddress.slice(0, 8)}...`)
        setUserBet({
          amount: betAmount,
          player: playerAddress,
          placed: true,
          predictedWinner: playerAddress,
          claimed: false,
          timestamp: Date.now()
        })
        setBetAmount("0.01")
        setSelectedPlayer("")
      }
    } catch (error) {
      console.error('Failed to place bet:', error)
      toast.error("Failed to place bet")
    }
  }

  const handleClaimWinnings = async () => {
    if (!gameId) return

    try {
      const result = await claimBettingWinnings(gameId)
      
      if (result.success) {
        toast.success("Winnings claimed successfully!")
        setUserBet(null)
      }
    } catch (error) {
      console.error('Failed to claim winnings:', error)
      toast.error("Failed to claim winnings")
    }
  }

  const handleWithdrawBalance = async () => {
    try {
      const result = await withdrawSpectatorBalance()
      
      if (result.success) {
        toast.success("Balance withdrawn successfully!")
      }
    } catch (error) {
      console.error('Failed to withdraw balance:', error)
      toast.error("Failed to withdraw balance")
    }
  }

  const selectPlayerForBet = (playerAddress: string) => {
    setSelectedPlayer(playerAddress)
  }

  // ✅ NEW: Enhanced profit calculator with detailed breakdown
  const calculatePotentialProfit = (betAmount: string, selectedPlayer: string) => {
    if (!bettingInfo || !betAmount || parseFloat(betAmount) <= 0) {
      return {
        potentialWinnings: "0.00",
        potentialProfit: "0.00",
        profitPercentage: "0.00",
        yourShare: "0.00",
        totalPrizePool: "0.00",
        houseFee: "0.00"
      }
    }

    const betAmountNum = parseFloat(betAmount)
    const totalGameBets = parseFloat(bettingInfo.totalBetAmount) || 0
    
    // Calculate total prize pool after house fee
    const totalPrizePool = (totalGameBets + betAmountNum) * 0.97
    const houseFee = (totalGameBets + betAmountNum) * 0.03
    
    // Estimate your share (this is approximate since we don't know exact player distribution)
    // For demonstration, we'll assume equal distribution among players
    const estimatedShare = betAmountNum / (totalGameBets + betAmountNum)
    
    // Calculate potential winnings and profit
    const potentialWinnings = totalPrizePool * estimatedShare
    const potentialProfit = potentialWinnings - betAmountNum
    const profitPercentage = betAmountNum > 0 ? (potentialProfit / betAmountNum) * 100 : 0
    
    return {
      potentialWinnings: potentialWinnings.toFixed(4),
      potentialProfit: potentialProfit.toFixed(4),
      profitPercentage: profitPercentage.toFixed(2),
      yourShare: (estimatedShare * 100).toFixed(2),
      totalPrizePool: totalPrizePool.toFixed(4),
      houseFee: houseFee.toFixed(4)
    }
  }

  // ✅ NEW: Calculate actual winnings when user wins a bet
  const calculateActualWinnings = (userBet: any, bettingInfo: any) => {
    if (!userBet || !bettingInfo) {
      return {
        originalBet: "0.00",
        totalGameBets: "0.00",
        houseFee: "0.00",
        prizePool: "0.00",
        yourShare: "0.00",
        winnings: "0.00",
        profit: "0.00",
        profitPercentage: "0.00"
      }
    }

    const originalBet = parseFloat(userBet.amount)
    const totalGameBets = parseFloat(bettingInfo.totalBetAmount) || 0
    
    // Calculate prize pool after house fee
    const prizePool = totalGameBets * 0.97
    const houseFee = totalGameBets * 0.03
    
    // Calculate your share of the prize pool
    // This is approximate since we don't know exact player distribution
    // In reality, this would come from the smart contract
    const estimatedShare = originalBet / totalGameBets
    const winnings = prizePool * estimatedShare
    const profit = winnings - originalBet
    const profitPercentage = originalBet > 0 ? (profit / originalBet) * 100 : 0
    
    return {
      originalBet: originalBet.toFixed(4),
      totalGameBets: totalGameBets.toFixed(4),
      houseFee: houseFee.toFixed(4),
      prizePool: prizePool.toFixed(4),
      yourShare: (estimatedShare * 100).toFixed(2),
      winnings: winnings.toFixed(4),
      profit: profit.toFixed(4),
      profitPercentage: profitPercentage.toFixed(2)
    }
  }

  // ✅ FIXED: Action handlers with manual refresh calls
  const handleJoinGame = async () => {
    if (!gameState?.canJoin) {
      toast.error("Cannot join this game")
      return
    }
    
    try {
      const result = await joinGame(gameId!, gameState.entryFee)
      if (result.success) {
        toast.success("Successfully joined the game!")
        // Manual refresh after successful action
        setTimeout(() => {
          manualRefresh()
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
    if (isNaN(move) || move < 1) {
      toast.error("Please enter a valid move (must be 1 or greater)")
      return
    }

    try {
      const result = await makeMove(gameId!, move)
      if (result.success) {
        setMoveAmount("")
        toast.success(`Move submitted: ${move}`)
        
        // Manual refresh after successful move
        setTimeout(() => {
          manualRefresh()
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
          manualRefresh()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to handle timeout:', error)
      toast.error("Failed to process timeout")
    }
  }

  // Loading state
  if (isLoading && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
              <p className="text-lg text-slate-300">Loading Hardcore Mystery battle...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-4">Battle Not Found</h1>
            <p className="text-slate-300 mb-6">{error || 'Failed to load battle data'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={manualRefresh}
                disabled={isLoading}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? "Retrying..." : "Try Again"}
              </Button>
              <Button
                onClick={() => router.push('/browse')}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Browse
              </Button>
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
                      onClick={manualRefresh}
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

            {/* Debug Info Toggle */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="bg-yellow-900/20 border border-yellow-500/30">
                <CardContent className="py-3">
                  <Button
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    {showDebugInfo ? "Hide" : "Show"} Debug Info
                  </Button>
                  
                  {showDebugInfo && (
                    <div className="mt-4 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div>isUserInGame: <span className={gameState.isUserInGame ? "text-green-400" : "text-red-400"}>{gameState.isUserInGame ? "YES" : "NO"}</span></div>
                          <div>isMyTurn: <span className={gameState.isMyTurn ? "text-green-400" : "text-red-400"}>{gameState.isMyTurn ? "YES" : "NO"}</span></div>
                          <div>timeLeft: <span className="text-cyan-400">{getCurrentTimeLeft()}s</span></div>
                          <div>moveCount: <span className="text-cyan-400">{gameState.moveCount}</span></div>
                        </div>
                                                 <div>
                           <div>currentPlayer: <span className="text-white">{gameState.currentPlayer?.slice(0, 8)}...</span></div>
                           <div>yourAddress: <span className="text-white">{address?.slice(0, 8)}...</span></div>
                           <div>players: <span className="text-white">{gameState.players.length}/{gameState.maxPlayers}</span></div>
                           <div>mode: <span className="text-white">{gameState.mode}</span></div>
                           {gameState.mode === "Last Stand" && (
                             <>
                               <div>activePlayers: <span className="text-white">{gameState.activePlayers.length}</span></div>
                               <div>eliminatedPlayers: <span className="text-white">{gameState.eliminatedPlayers.length}</span></div>
                             </>
                           )}
                         </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-slate-800/40 rounded">
                        <div className="font-bold text-yellow-400 mb-1">COMPONENT STATE:</div>
                        <div>initialFetchDone: <span className="text-cyan-400">{initialFetchDoneRef.current ? "YES" : "NO"}</span></div>
                        <div>isMounted: <span className="text-cyan-400">{isMountedRef.current ? "YES" : "NO"}</span></div>
                        <div>contractsReady: <span className="text-cyan-400">{contractsReady ? "YES" : "NO"}</span></div>
                        <div>providerReady: <span className="text-cyan-400">{providerReady ? "YES" : "NO"}</span></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refresh Warning */}
            <Card className="bg-amber-900/20 border border-amber-500/30 shadow-2xl rounded-2xl">
              <CardContent className="py-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-bold text-sm">⚠️ IMPORTANT: Refresh to See Opponent Moves</p>
                    <p className="text-amber-300 text-xs mt-1">
                      Always refresh the game to see when your opponent makes a move. This will be fixed with real-time updates in the future.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Status Cards */}
            {gameState.status === "waiting" && (
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-amber-400" />
                    WAITING FOR PLAYERS
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="w-24 h-24 bg-amber-500/20 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-12 h-12 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Battle Ready!</h3>
                    <p className="text-slate-300 mb-4">
                      {gameState.isUserCreator 
                        ? "Your battle is waiting for players to join." 
                        : "This battle is waiting for players."}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Entry Fee: {parseFloat(gameState.entryFee).toFixed(4)} MNT • Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} MNT
                    </p>
                    <p className="text-slate-400 text-sm">
                      Players: {gameState.players.length}/{gameState.maxPlayers}
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
                            <Plus className="w-5 h-5 mr-2" />
                          )}
                          {transactionLoading ? "Joining..." : "Join Battle"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Game */}
            {gameState.status === "active" && (
              <>
                {/* Current Game State */}
                <Card className="bg-slate-800/60 backdrop-blur-sm border border-emerald-500/30 shadow-2xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black text-white flex items-center">
                      <Swords className="w-6 h-6 mr-3 text-emerald-400" />
                      BATTLE IN PROGRESS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Turn Timer */}
                    <div className="text-center">
                      <div className="mb-4">
                        <p className="text-slate-400 text-sm mb-2">TURN TIMER</p>
                        <div className={`text-4xl font-black ${getCurrentTimeLeft() <= 10 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                          {formatTime(getCurrentTimeLeft())}
                        </div>
                        {getCurrentTimeLeft() <= 10 && (
                          <div className="mt-2 text-red-400 text-sm font-bold animate-pulse">
                            ⚠️ TIME RUNNING OUT!
                          </div>
                        )}
                      </div>
                      <Progress 
                        value={(getCurrentTimeLeft() / (gameState.timeLeft || 90)) * 100} 
                        className={`h-2 ${getCurrentTimeLeft() <= 10 ? 'bg-red-700' : 'bg-slate-700'}`}
                      />
                    </div>

                    {/* Current Player */}
                    <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                      <p className="text-slate-400 text-sm mb-2">CURRENT PLAYER</p>
                      <p className="text-white font-bold">
                        {gameState.currentPlayer === address ? "YOUR TURN" : "OPPONENT'S TURN"}
                      </p>
                      <p className="text-slate-300 text-sm">
                        {gameState.currentPlayer.slice(0, 8)}...{gameState.currentPlayer.slice(-8)}
                      </p>
                    </div>

                    {/* Move Counter */}
                    <div className="text-center">
                      <p className="text-slate-400 text-sm mb-2">MOVE COUNT</p>
                      <p className="text-2xl font-bold text-cyan-400">{gameState.moveCount}</p>
                    </div>

                    {/* Spectator Betting Interface */}
                    {!gameState.isUserInGame && (
                      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-purple-400 flex items-center">
                            <Coins className="w-5 h-5 mr-2" />
                            SPECTATOR BETTING
                          </h3>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            🎲 LIVE
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Player Selection */}
                          <div className={`grid gap-3 ${
                            gameState.mode === "Last Stand" 
                              ? "grid-cols-4" 
                              : "grid-cols-2"
                          }`}>
                            {gameState.mode === "Last Stand" ? (
                              // Last Stand: Show all active players
                              gameState.activePlayers.map((player, index) => (
                                <Button
                                  key={player}
                                  onClick={() => selectPlayerForBet(player)}
                                  className={`h-16 text-sm font-bold ${
                                    selectedPlayer === player
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-bold">
                                      {index === 0 ? "Creator" : `Player ${index + 1}`}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      {player.slice(0, 6)}...{player.slice(-4)}
                                    </div>
                                  </div>
                                </Button>
                              ))
                            ) : (
                              // Hardcore Mystery: Show 2 players
                              <>
                                <Button
                                  onClick={() => selectPlayerForBet(gameState.players[0])}
                                  className={`h-16 text-sm font-bold ${
                                    selectedPlayer === gameState.players[0]
                                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                                      : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-bold">Creator</div>
                                    <div className="text-xs opacity-80">
                                      {gameState.players[0]?.slice(0, 8)}...
                                    </div>
                                  </div>
                                </Button>
                                
                                <Button
                                  onClick={() => selectPlayerForBet(gameState.players[1])}
                                  className={`h-16 text-sm font-bold ${
                                    selectedPlayer === gameState.players[1]
                                      ? "bg-green-600 hover:bg-green-700 text-white"
                                      : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-bold">Opponent</div>
                                    <div className="text-xs opacity-80">
                                      {gameState.players[1]?.slice(0, 8)}...
                                    </div>
                                  </div>
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Bet Amount Input */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300">Bet Amount (MNT)</label>
                            <Input
                              type="number"
                              value={betAmount}
                              onChange={(e) => setBetAmount(e.target.value)}
                              placeholder="0.01"
                              min="0.01"
                              step="0.01"
                              className="bg-slate-800/50 border-slate-600/50 text-white text-center font-bold"
                            />
                          </div>

                          {/* Place Bet Button */}
                          <Button
                            onClick={() => selectedPlayer && handlePlaceBet(selectedPlayer)}
                            disabled={!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0 || bettingLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3"
                          >
                            {bettingLoading ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <TrendingUp className="w-5 h-5 mr-2" />
                            )}
                            {bettingLoading ? "PLACING BET..." : `PLACE BET (${betAmount} MNT)`}
                          </Button>

                          {/* Current Bet Display */}
                          {userBet && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                              <p className="text-sm text-emerald-400 font-bold">Your Current Bet</p>
                              <p className="text-white">
                                {userBet.amount} MNT on {userBet.player.slice(0, 8)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeout Warning */}
                    {getCurrentTimeLeft() <= 30 && getCurrentTimeLeft() > 0 && (
                      <div className="text-center p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          <p className="text-amber-400 font-bold">TIMEOUT WARNING</p>
                        </div>
                        <p className="text-amber-300 text-sm">
                          {getCurrentTimeLeft() <= 10 
                            ? "⚠️ Time is running out! Make your move quickly!" 
                            : "⏰ Less than 30 seconds remaining!"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Make Move Section */}
                {gameState.isMyTurn && (
                  <Card className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/30 shadow-2xl rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-2xl font-black text-white flex items-center">
                        <Brain className="w-6 h-6 mr-3 text-blue-400" />
                        MAKE YOUR MOVE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <p className="text-slate-300 mb-4">
                          Enter your move carefully - one wrong move means instant death!
                        </p>
                        <p className="text-red-400 text-sm mb-4">
                          ⚠️ Hidden numbers - instant death on wrong move!
                        </p>
                      </div>

                      <div className="flex space-x-3 max-w-md mx-auto">
                        <Input
                          type="number"
                          placeholder="Enter your move..."
                          value={moveAmount}
                          onChange={(e) => setMoveAmount(e.target.value)}
                          className="flex-1 text-center text-lg font-bold"
                          min="1"
                        />
                        <Button 
                          onClick={() => handleMakeMove()}
                          disabled={!isActionAllowed() || !moveAmount}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-6"
                        >
                          {transactionLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Minus className="w-4 h-4 mr-2" />
                          )}
                          {transactionLoading ? "Submitting..." : "Submit"}
                        </Button>
                      </div>

                      <div className="text-center text-slate-400 text-sm">
                        <p>Move must be a positive number</p>
                        <p>Time remaining: {formatTime(getCurrentTimeLeft())}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeout Handling */}
                {(getCurrentTimeLeft() === 0 || gameState.timeLeft === 0) && gameState.status === "active" && (
                  <Card className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 shadow-2xl rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <div>
                          <span className="font-bold text-red-400 text-xl">⏰ TIME EXPIRED!</span>
                          <p className="text-sm text-red-300">
                            {gameState.isMyTurn ? "Your time expired" : "Opponent's time expired"}
                          </p>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <p className="text-red-300 text-sm">
                          {gameState.isMyTurn 
                            ? "You can accept your timeout to skip your turn"
                            : "You can claim the opponent's timeout to win the battle"
                          }
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={handleTimeoutAction}
                          disabled={transactionLoading}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6"
                        >
                          {transactionLoading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Clock className="w-5 h-5 mr-2" />
                          )}
                          {transactionLoading ? "PROCESSING..." : 
                           gameState.isMyTurn ? "Accept My Timeout" : "Claim Opponent Timeout"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Spectator View */}
                {!gameState.isUserInGame && (
                  <Card className="bg-gradient-to-r from-slate-900/30 to-gray-900/30 border border-slate-500/30 shadow-2xl rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-400 text-xl">SPECTATOR MODE</h3>
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          WATCHING
                        </Badge>
                      </div>
                      
                                             <p className="text-slate-300 text-center mb-4">
                         You are watching this {gameState.mode} battle as a spectator. 
                         <br />
                         Current player: {gameState.mode === "Last Stand" ? (
                           gameState.activePlayers.findIndex(p => p.toLowerCase() === gameState.currentPlayer.toLowerCase()) === 0
                             ? `${gameState.currentPlayer.slice(0, 8)}... (Creator)`
                             : `${gameState.currentPlayer.slice(0, 8)}... (Player ${gameState.activePlayers.findIndex(p => p.toLowerCase() === gameState.currentPlayer.toLowerCase()) + 1})`
                         ) : (
                           gameState.currentPlayer === gameState.players[0] ? 
                             `${gameState.players[0]?.slice(0, 8)}... (Creator)` : 
                             `${gameState.players[1]?.slice(0, 8)}... (Opponent)`
                         )}
                       </p>
                      
                      <div className="text-center text-slate-400 text-sm">
                        <p>Hidden numbers - instant death on wrong move!</p>
                        <p>90-second turns with timeout system</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Completed Game */}
            {gameState.status === "completed" && (
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-violet-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-white flex items-center">
                    <Trophy className="w-6 h-6 mr-3 text-violet-400" />
                    BATTLE COMPLETED
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="w-24 h-24 bg-violet-500/20 border-2 border-violet-500/30 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-12 h-12 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Battle Finished!</h3>
                    {gameState.winner ? (
                      <div>
                        <p className="text-slate-300 mb-2">Winner:</p>
                        <p className="text-violet-400 font-bold text-lg">
                          {gameState.winner === address ? "YOU WON! 🎉" : gameState.winner.slice(0, 8) + "..." + gameState.winner.slice(-8)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-300">Game ended</p>
                    )}
                    <p className="text-slate-400 text-sm mt-4">
                      Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} MNT
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">Game Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mode:</span>
                  <span className="text-white font-bold">{gameState.mode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Entry Fee:</span>
                  <span className="text-emerald-400 font-bold">{parseFloat(gameState.entryFee).toFixed(4)} MNT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prize Pool:</span>
                  <span className="text-amber-400 font-bold">{parseFloat(gameState.prizePool).toFixed(4)} MNT</span>
                </div>
                                 <div className="flex items-center justify-between">
                   <span className="text-slate-400">Players:</span>
                   <span className="text-cyan-400 font-bold">
                     {gameState.mode === "Last Stand" 
                       ? `${gameState.activePlayers.length} survivors / ${gameState.maxPlayers} total`
                       : `${gameState.players.length}/${gameState.maxPlayers}`
                     }
                   </span>
                 </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Moves:</span>
                  <span className="text-white font-bold">{gameState.moveCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Spectator Betting Sidebar */}
            {!gameState.isUserInGame && (
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-white flex items-center">
                    <Coins className="w-5 h-5 mr-2 text-purple-400" />
                    SPECTATOR BETTING
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Betting Status */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-purple-400 mb-1">BETTING STATUS</p>
                    <p className="text-white font-bold">
                      {gameState.status === "active" ? "🎲 LIVE" : "⏸️ CLOSED"}
                    </p>
                  </div>

                  {/* Current Bet Display */}
                  {userBet && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                      <p className="text-xs font-bold text-emerald-400 mb-1">YOUR BET</p>
                      <p className="text-white text-sm">
                        {userBet.amount} MNT on {userBet.player.slice(0, 8)}...
                      </p>
                      <p className="text-emerald-300 text-xs mt-1">
                        {gameState.status === "completed" ? "Game finished - claim winnings!" : "Bet active"}
                      </p>
                    </div>
                  )}

                  {/* Betting Actions */}
                  {!userBet && gameState.status === "active" && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 text-center">
                        Select a player and place your bet to start spectating with stakes!
                      </p>
                    </div>
                  )}

                  {userBet && gameState.status === "completed" && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleClaimWinnings}
                        disabled={bettingLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        size="sm"
                      >
                        {bettingLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-2" />
                        )}
                        Claim Winnings
                      </Button>
                    </div>
                  )}

                  {/* Spectator Balance */}
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">SPECTATOR BALANCE</p>
                    <p className="text-white font-bold">0.00 MNT</p>
                    <Button
                      onClick={handleWithdrawBalance}
                      disabled={bettingLoading}
                      className="w-full mt-2 bg-slate-600 hover:bg-slate-700 text-white"
                      size="sm"
                    >
                      {bettingLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wallet className="w-4 h-4 mr-2" />
                      )}
                      Withdraw Balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={manualRefresh}
                  disabled={isLoading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh Game Data
                </Button>
                <Button
                  onClick={handleTimeoutAction}
                  disabled={transactionLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Accept Timeout
                </Button>
                <Button
                  onClick={handleClaimWinnings}
                  disabled={bettingLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
                  size="sm"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Claim Winnings
                </Button>
                <Button
                  onClick={handleWithdrawBalance}
                  disabled={bettingLoading}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3"
                  size="sm"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Withdraw Balance
                </Button>
              </CardContent>
            </Card>

            {/* Players List */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {gameState?.mode === "Last Stand" ? "All Players (8)" : "Players"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState?.mode === "Last Stand" ? (
                  // Last Stand: Show all 8 players with elimination status
                  <>
                    {/* Show active/surviving players */}
                    {gameState.activePlayers.map((player, index) => (
                      <div key={`active-${index}`} className="flex items-center justify-between p-2 bg-emerald-700/30 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white font-medium">
                            {index === 0 ? "Creator" : `Player ${index + 1}`}
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            SURVIVING
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-300 font-mono">
                            {player.slice(0, 6)}...{player.slice(-4)}
                          </span>
                          {address && player.toLowerCase() === address.toLowerCase() && (
                            <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">You</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show actual eliminated players */}
                    {gameState.eliminatedPlayers.map((player, index) => (
                      <div key={`eliminated-${index}`} className="flex items-center justify-between p-2 bg-red-700/20 border border-red-500/20 rounded-lg opacity-60">
                        <div className="flex items-center space-x-2">
                          <X className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-slate-400">
                            Eliminated Player
                          </span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            ELIMINATED
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 font-mono">
                            {player.slice(0, 6)}...{player.slice(-4)}
                          </span>
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                            Wrong Move
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-xs text-slate-400 text-center p-2">
                      {gameState.activePlayers.length} survivors / 8 total players
                    </div>
                    
                    {/* Elimination Summary */}
                    {gameState.eliminatedPlayers.length > 0 && (
                      <div className="text-xs text-red-400 text-center p-2 bg-red-500/10 border border-red-500/20 rounded">
                        💀 {gameState.eliminatedPlayers.length} player{gameState.eliminatedPlayers.length > 1 ? 's' : ''} eliminated
                      </div>
                    )}
                  </>
                ) : (
                  // Hardcore Mystery: Show 2 players
                  <>
                    {gameState.players.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {index === 0 ? (
                            <Shield className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Swords className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-sm text-white">
                            {index === 0 ? "Creator" : `Player ${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {player.slice(0, 6)}...{player.slice(-4)}
                          </span>
                          {address && player.toLowerCase() === address.toLowerCase() && (
                            <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">You</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* ✅ NEW: Spectator Betting Interface */}
            {!gameState?.isUserInGame && gameState?.status === "active" && (
              <Card className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-purple-400 flex items-center">
                    <Coins className="w-5 h-5 mr-2" />
                    SPECTATOR BETTING
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Betting Status */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-purple-400 mb-1">BETTING STATUS</p>
                    <div className="space-y-2">
                      <p className="text-white font-bold">
                        {userBetStatus.bettingAllowed ? "🎲 LIVE" : "⏸️ CLOSED"}
                      </p>
                      {userBetStatus.hasBet && (
                        <p className="text-blue-400 text-sm">✅ You have placed a bet</p>
                      )}
                      {!userBetStatus.hasBet && userBetStatus.canBet && (
                        <p className="text-emerald-400 text-sm">💰 You can place a bet</p>
                      )}
                      {!userBetStatus.canBet && !userBetStatus.hasBet && (
                        <p className="text-slate-400 text-sm">❌ Betting not available</p>
                      )}
                    </div>
                  </div>

                  {/* Betting Info */}
                  {bettingInfo && (
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-400 mb-1">GAME BETTING INFO</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-white">Total Bets: {bettingInfo.totalBetAmount} ETH</p>
                        <p className="text-white">Number of Bets: {bettingInfo.numberOfBets}</p>
                      </div>
                    </div>
                  )}

                  {/* No Bet Yet - Show Betting Interface */}
                  {!userBet && userBetStatus.canBet && (
                    <div className="space-y-4">
                      <p className="text-slate-300 text-center">
                        Choose a player and place your bet to start spectating with stakes!
                      </p>
                      
                      {/* Player Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        {gameState.players.map((player, index) => (
                          <Button
                            key={index}
                            onClick={() => selectPlayerForBet(player)}
                            className={`h-16 text-sm font-bold ${
                              selectedPlayer === player
                                ? index === 0 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-bold">
                                {index === 0 ? "Creator" : "Player"}
                              </div>
                              <div className="text-xs opacity-80">
                                {player.slice(0, 8)}...
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>

                      {/* Bet Amount Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300">Bet Amount (ETH)</label>
                        <Input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="0.01"
                          min="0.01"
                          step="0.01"
                          className="bg-slate-800/50 border-slate-600/50 text-white text-center font-bold"
                        />
                        
                        {/* Enhanced Profit Calculator */}
                        {betAmount && parseFloat(betAmount) > 0 && selectedPlayer && (
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-xs font-bold text-blue-400 mb-3 text-center">💰 PROFIT CALCULATOR</p>
                            
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Your Bet</p>
                                <p className="text-white font-bold">{betAmount} ETH</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-slate-400">Betting On</p>
                                <p className="text-cyan-400 font-bold">
                                  {selectedPlayer === gameState.players[0] ? "Creator" : "Player"}
                                </p>
                              </div>
                            </div>

                            {/* Profit Breakdown */}
                            {(() => {
                              const profitData = calculatePotentialProfit(betAmount, selectedPlayer)
                              return (
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Total Prize Pool:</span>
                                    <span className="text-white">{profitData.totalPrizePool} ETH</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">House Fee (3%):</span>
                                    <span className="text-red-400">-{profitData.houseFee} ETH</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Your Share:</span>
                                    <span className="text-blue-400">{profitData.yourShare}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Potential Winnings:</span>
                                    <span className="text-emerald-400">{profitData.potentialWinnings} ETH</span>
                                  </div>
                                  
                                  {/* Profit/Loss Display */}
                                  <div className="border-t border-slate-600/50 pt-2 mt-2">
                                    <div className="flex justify-between">
                                      <span className="text-slate-300 font-bold">Potential Profit:</span>
                                      <span className={`font-bold text-lg ${
                                        parseFloat(profitData.potentialProfit) >= 0 
                                          ? "text-emerald-400" 
                                          : "text-red-400"
                                      }`}>
                                        {parseFloat(profitData.potentialProfit) >= 0 ? "+" : ""}
                                        {profitData.potentialProfit} ETH
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className={`text-xs ${
                                        parseFloat(profitData.profitPercentage) >= 0 
                                          ? "text-emerald-400" 
                                          : "text-red-400"
                                      }`}>
                                        ({parseFloat(profitData.profitPercentage) >= 0 ? "+" : ""}
                                        {profitData.profitPercentage}% return)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                            
                            {/* Educational Note */}
                            <div className="mt-3 p-2 bg-slate-700/30 rounded text-xs text-slate-400">
                              <p className="font-bold mb-1">💡 How it works:</p>
                              <p>• More competition = Lower individual profits</p>
                              <p>• Higher total volume = Bigger prize pool</p>
                              <p>• House fee always applies (3%)</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Place Bet Button */}
                      <Button
                        onClick={() => selectedPlayer && handlePlaceBet(selectedPlayer)}
                        disabled={!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0 || bettingLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3"
                      >
                        {bettingLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <TrendingUp className="w-5 h-5 mr-2" />
                        )}
                        {bettingLoading ? "PLACING BET..." : `PLACE BET (${betAmount} ETH)`}
                      </Button>
                    </div>
                  )}
                  
                  {/* Bet Placed - Show Active Bet Status */}
                  {userBet && (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Coins className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-blue-400 mb-2">🎯 BET PLACED!</h3>
                        <p className="text-white mb-3">
                          You bet <span className="font-bold text-emerald-400">{userBet.amount} ETH</span> on{' '}
                          <span className="font-bold text-cyan-400">
                            {userBet.player === gameState.players[0] ? "Creator" : "Player"}
                          </span>
                        </p>
                        <p className="text-blue-300 text-sm">
                          Wait for the game to finish to see if you won!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ✅ NEW: Game Completed - Show Bet Result */}
            {!gameState?.isUserInGame && gameState?.status === "completed" && userBet && (
              <Card className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/30 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-violet-400 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    BET RESULT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Check if user's bet was a winning bet */}
                  {userBet.player.toLowerCase() === gameState.winner?.toLowerCase() ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trophy className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">🎉 WINNING BET!</h3>
                        <p className="text-white mb-3">
                          You correctly predicted the winner! Claim your winnings.
                        </p>
                        
                        {/* ✅ NEW: Detailed Winnings Breakdown */}
                        {(() => {
                          const winningsData = calculateActualWinnings(userBet, bettingInfo)
                          return (
                            <div className="bg-emerald-600/20 border border-emerald-500/40 rounded-lg p-4 mb-4 text-left">
                              <p className="text-xs font-bold text-emerald-400 mb-3 text-center">💰 WINNINGS BREAKDOWN</p>
                              
                              {/* Winnings Summary */}
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="text-center">
                                  <p className="text-xs text-emerald-300">Your Original Bet</p>
                                  <p className="text-white font-bold">{winningsData.originalBet} ETH</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-emerald-300">Total Winnings</p>
                                  <p className="text-emerald-400 font-bold text-lg">{winningsData.winnings} ETH</p>
                                </div>
                              </div>
                              
                              {/* Detailed Breakdown */}
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-emerald-300">Total Game Bets:</span>
                                  <span className="text-white">{winningsData.totalGameBets} ETH</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-300">House Fee (3%):</span>
                                  <span className="text-red-400">-{winningsData.houseFee} ETH</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-300">Prize Pool:</span>
                                  <span className="text-white">{winningsData.prizePool} ETH</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-300">Your Share:</span>
                                  <span className="text-emerald-400">{winningsData.yourShare}%</span>
                                </div>
                              </div>
                              
                              {/* Profit Display */}
                              <div className="border-t border-emerald-500/40 pt-3 mt-3">
                                <div className="flex justify-between">
                                  <span className="text-emerald-300 font-bold">Your Profit:</span>
                                  <span className="text-emerald-400 font-bold text-lg">
                                    +{winningsData.profit} ETH
                                  </span>
                                </div>
                                <div className="text-center">
                                  <span className="text-emerald-300 text-xs">
                                    (+{winningsData.profitPercentage}% return on investment!)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                        
                        <Button
                          onClick={handleClaimWinnings}
                          disabled={bettingLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
                        >
                          {bettingLoading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <Trophy className="w-5 h-5 mr-2" />
                          )}
                          {bettingLoading ? "CLAIMING WINNINGS..." : "CLAIM WINNINGS"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <X className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-red-400 mb-2">❌ LOSING BET</h3>
                        <p className="text-white mb-3">
                          Your prediction was incorrect. No winnings to claim.
                        </p>
                        <p className="text-red-300 text-sm">
                          Better luck next time! You can place new bets on other active games.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Rules */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {gameState?.mode === "Last Stand" ? (
                  <>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">8-player battle royale - last survivor wins!</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">Hidden numbers with instant elimination</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">90-second turns with timeout system</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">Winner takes entire prize pool</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">Hidden numbers - instant death on wrong move!</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">90-second turns</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-slate-300">Winner takes all</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeout Rules */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Timeout Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">TIMEOUT RULES</span>
                  </div>
                  <ul className="text-xs text-amber-300 space-y-1">
                    <li>• 1st timeout: Turn is skipped</li>
                    <li>• 2nd timeout: You lose the battle</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}