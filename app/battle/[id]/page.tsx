"use client"

import { useEffect, useState, useCallback } from "react"
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
  TrendingUp
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
import { useSpectatorContract, GameContract, useSpectatorData } from "@/hooks/useSpectatorContract"
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

export default function FixedBattlePage() {
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

  // Spectator betting hooks
  const {
    placeBet,
    claimBettingWinnings,
    withdrawSpectatorBalance,
    loading: bettingLoading
  } = useSpectatorContract()

  // ✅ NEW: Enhanced spectator data hooks for real contract data
  const {
    hasUserBetOnGame,
    getUserBetInfo,
    getBettingInfo,
    isBettingAllowed,
    getUserBettingHistory,
    getUserBettingHistoryDetailed,
    getGameBettingStats
  } = useSpectatorData()

  // State management
  const [gameState, setGameState] = useState<EnhancedGameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState("0")
  const [moveAmount, setMoveAmount] = useState("")
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [showBettingHistory, setShowBettingHistory] = useState(false)
  
  // Betting state
  const [betAmount, setBetAmount] = useState("0.01")
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [bettingInfo, setBettingInfo] = useState<{
    totalBetAmount: string
    numberOfBets: number
    bettingAllowed: boolean
  } | null>(null)
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

  // ✅ NEW: Betting history state
  const [bettingHistory, setBettingHistory] = useState<{
    gameKeys: string[]
    gameContracts: string[]
    gameIds: number[]
    predictedWinners: string[]
    amounts: string[]
    claimed: boolean[]
    timestamps: number[]
  }>({
    gameKeys: [],
    gameContracts: [],
    gameIds: [],
    predictedWinners: [],
    amounts: [],
    claimed: [],
    timestamps: []
  })

  // ✅ NEW: Enhanced betting info with stats
  const [enhancedBettingInfo, setEnhancedBettingInfo] = useState<{
    totalBetAmount: string
    numberOfBets: number
    numberOfUniqueBettors: number
    bettingAllowed: boolean
    players: string[]
    playerBetAmounts: string[]
    playerBetCounts: number[]
  } | null>(null)

  // ✅ NEW: Fetch betting history and enhanced stats
  const fetchBettingHistory = useCallback(async () => {
    if (!address || !contractsReady) return

    try {
      console.log('📚 Fetching betting history for user:', address)
      
      // Get user's detailed betting history
      const history = await getUserBettingHistoryDetailed(address, 20) // Last 20 bets
      setBettingHistory(history)
      console.log('📚 Betting history fetched:', history)
      
    } catch (error) {
      console.error('Failed to fetch betting history:', error)
    }
  }, [address, contractsReady, getUserBettingHistoryDetailed])

  // ✅ NEW: Fetch enhanced betting stats for current game
  const fetchEnhancedBettingStats = useCallback(async () => {
    if (!gameId || !contractsReady) return

    try {
      console.log('📊 Fetching enhanced betting stats for game:', gameId)
      
      // Get comprehensive betting stats for this game
      const stats = await getGameBettingStats(GameContract.ZEROSUM_SIMPLIFIED, gameId)
      setEnhancedBettingInfo(stats)
      console.log('📊 Enhanced betting stats fetched:', stats)
      
    } catch (error) {
      console.error('Failed to fetch enhanced betting stats:', error)
    }
  }, [gameId, contractsReady, getGameBettingStats])

  // Fetch game data function
  const fetchGameData = useCallback(async () => {
    if (!gameId || !isConnected || !address || !contractsReady) {
      console.log('⏸️ Skipping fetch - requirements not met:', {
        gameId: !!gameId,
        isConnected,
        address: !!address,
        contractsReady
      })
      return
    }

    console.log(`🎮 Fetching data for game ${gameId}`)
    setIsLoading(true)
    setError(null)

    try {
      // Parallel fetch for better performance
      const [gameData, players, balance] = await Promise.all([
        getGame(gameId),
        getPlayers(gameId),
        getPlayerBalance(address)
      ])
      
      // Also fetch user's betting info from smart contract
      try {
        // ✅ NEW: Use real smart contract functions instead of localStorage
        if (isConnected && address) {
          // Check if user has bet on this game
          const hasBet = await hasUserBetOnGame(GameContract.ZEROSUM_SIMPLIFIED, gameId, address)
          
          if (hasBet) {
            // Get detailed bet information
            const betInfo = await getUserBetInfo(GameContract.ZEROSUM_SIMPLIFIED, gameId, address)
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
          const canBet = await isBettingAllowed(GameContract.ZEROSUM_SIMPLIFIED, gameId)
          const isUserInGame = players.some(p => p.toLowerCase() === address.toLowerCase())
          
          setUserBetStatus({
            hasBet,
            canBet: canBet && !isUserInGame,
            bettingAllowed: canBet
          })
        }
        
        // Get general betting info for the game
        const gameBettingInfo = await getBettingInfo(GameContract.ZEROSUM_SIMPLIFIED, gameId)
        if (gameBettingInfo) {
          setBettingInfo(gameBettingInfo)
        }
        
        // ✅ NEW: Fetch enhanced betting stats and history
        await Promise.all([
          fetchEnhancedBettingStats(),
          fetchBettingHistory()
        ])
      } catch (error) {
        console.log('Could not fetch betting info from contract:', error)
        // Fallback to old method
        await fetchUserBet()
      }

      if (!gameData) {
        throw new Error(`Game #${gameId} not found on blockchain`)
      }

      console.log('📊 Raw game data:', gameData)
      console.log('👥 Players:', players)

      // Update user balance
      setUserBalance(balance)

      // Determine user relationship to game
      const isUserInGame = players.some(p => p.toLowerCase() === address.toLowerCase())
      const isUserCreator = players.length > 0 && players[0].toLowerCase() === address.toLowerCase()
      const canJoin = !isUserInGame && players.length < 2 && gameData.status === GameStatus.WAITING

      // Initialize player view data
      let playerViewData: PlayerView | null = null
      let isMyTurn = false
      let timeLeft = 0
      let gameStuck = false
      let stuckPlayer = ""
      let yourTimeouts = 0
      let opponentTimeouts = 0

      // Get enhanced player view for active games
      if (gameData.status === GameStatus.ACTIVE) {
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
          isMyTurn = isUserInGame && gameData.currentPlayer.toLowerCase() === address.toLowerCase()
          timeLeft = 0 // Can't get time left without player view
        }
      }

      // Double-check turn logic for consistency
      const currentPlayerIsMe = gameData.currentPlayer.toLowerCase() === address.toLowerCase()
      console.log('🔍 Turn logic verification:', {
        contractSaysMyTurn: isMyTurn,
        currentPlayerIsMe,
        isUserInGame,
        gameStatus: gameData.status,
        currentPlayer: gameData.currentPlayer
      })

      // Build enhanced game state
      const enhancedState: EnhancedGameState = {
        gameId,
        mode: gameData.mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic",
        status: gameData.status === GameStatus.WAITING ? "waiting" : 
                gameData.status === GameStatus.ACTIVE ? "active" : "completed",
        currentNumber: gameData.currentNumber,
        currentPlayer: gameData.currentPlayer,
        winner: gameData.winner && gameData.winner !== "0x0000000000000000000000000000000000000000" 
                ? gameData.winner : null,
        entryFee: gameData.entryFee,
                           prizePool: (parseFloat(gameData.entryFee) * 2).toString(),
        players,
        
        isUserInGame,
        isUserCreator,
        isMyTurn: isUserInGame ? currentPlayerIsMe : false, // Always use currentPlayer for turn logic
        canJoin,
        timeLeft,
        
        numberGenerated: gameData.numberGenerated,
        gameStuck,
        stuckPlayer,
        yourTimeouts,
        opponentTimeouts
      }

      setGameState(enhancedState)
      console.log('✅ Enhanced game state:', enhancedState)

    } catch (error) {
      console.error('❌ Error fetching game:', error)
      setError(error instanceof Error ? error.message : 'Failed to load game data')
    } finally {
      setIsLoading(false)
    }
  }, [gameId, isConnected, address, contractsReady, getGame, getPlayers, getPlayerView, getPlayerBalance])

  // Initial data fetch
  useEffect(() => {
    if (providerReady) {
      fetchGameData()
    }
  }, [providerReady, fetchGameData])

  // Refresh game data when wallet address changes (wallet switching)
  useEffect(() => {
    if (providerReady && contractsReady && address) {
      console.log('🔄 Wallet address changed, refreshing game data...', address)
      fetchGameData()
    }
  }, [address, providerReady, contractsReady, fetchGameData])

  // Real-time countdown timer
  useEffect(() => {
    if (gameState?.status === "active" && gameState.timeLeft > 0) {
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
          if (prev === null || prev <= 0) return 0
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setLocalTimeLeft(null)
    }
  }, [gameState?.status, gameState?.timeLeft])

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
    } else if (gameState.mode === "Strategic") {
      const current = gameState.currentNumber
      const min = Math.max(1, Math.ceil(current * 0.1))
      const max = Math.min(current - 1, Math.floor(current * 0.3))
      return { min, max }
    }
    
    return { min: 1, max: 1 }
  }

  const isActionAllowed = () => {
    return gameState?.isUserInGame && 
           gameState?.status === "active" && 
           gameState?.isMyTurn && 
           gameState?.timeLeft > 0
  }

  const getCurrentTimeLeft = () => {
    return localTimeLeft !== null ? localTimeLeft : gameState?.timeLeft || 0
  }

  // Betting functions
  const handlePlaceBet = async (playerAddress: string) => {
    if (!gameId || !betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount")
      return
    }

    try {
      const result = await placeBet(
        GameContract.ZEROSUM_SIMPLIFIED,
        gameId,
        playerAddress,
        betAmount
      )
      
      if (result.success) {
        const betData = {
          amount: betAmount,
          player: playerAddress,
          placed: true,
          predictedWinner: playerAddress,
          claimed: false,
          timestamp: Date.now()
        }
        
        toast.success(`Bet placed successfully! ${betAmount} MNT on ${playerAddress.slice(0, 8)}...`)
        setUserBet(betData)
        
        // Save bet to localStorage so it persists between page refreshes
        localStorage.setItem(`bet_${gameId}_${address}`, JSON.stringify(betData))
        console.log('💾 Bet saved to localStorage:', betData)
        
        setBetAmount("0.01")
        setSelectedPlayer("")
        
        // Refresh betting info
        fetchGameData()
        
        // ✅ NEW: Also refresh betting history and stats
        setTimeout(() => {
          fetchEnhancedBettingStats()
          fetchBettingHistory()
        }, 2000)
      } else {
        console.error('Bet placement failed:', result)
        toast.error(`Bet placement failed: ${result.txHash ? 'Transaction may have succeeded but response failed' : 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to place bet:', error)
      toast.error(`Failed to place bet: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Even if there's an error, check if the bet might have been placed
      // This handles cases where the transaction succeeded but the response failed
      console.log('🔄 Checking if bet was actually placed despite error...')
      setTimeout(() => {
        fetchUserBet()
      }, 2000)
    }
  }

  const handleClaimWinnings = async () => {
    if (!gameId) return

    try {
      const result = await claimBettingWinnings(
        GameContract.ZEROSUM_SIMPLIFIED,
        gameId
      )
      
      if (result.success) {
        toast.success("Winnings claimed successfully!")
        setUserBet(null)
        
        // Clear bet from localStorage
        if (gameId && address) {
          localStorage.removeItem(`bet_${gameId}_${address}`)
          console.log('🗑️ Bet cleared from localStorage')
        }
        
        // Refresh betting info
        fetchGameData()
        
        // ✅ NEW: Also refresh betting history and stats
        setTimeout(() => {
          fetchEnhancedBettingStats()
          fetchBettingHistory()
        }, 2000)
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
        // Refresh user balance
        fetchGameData()
      }
    } catch (error) {
      console.error('Failed to withdraw balance:', error)
      toast.error("Failed to withdraw balance")
    }
  }

  const selectPlayerForBet = (playerAddress: string) => {
    setSelectedPlayer(playerAddress)
  }

  // Fetch user's bet from smart contract
  const fetchUserBet = useCallback(async () => {
    if (!gameId || !address || !contractsReady) return

    try {
      // ✅ NEW: Use real smart contract functions instead of localStorage
      console.log('🔍 Fetching user bet from smart contract...')
      
      // Check if user has bet on this game
      const hasBet = await hasUserBetOnGame(GameContract.ZEROSUM_SIMPLIFIED, gameId, address)
      
      if (hasBet) {
        // Get detailed bet information
        const betInfo = await getUserBetInfo(GameContract.ZEROSUM_SIMPLIFIED, gameId, address)
        if (betInfo) {
          setUserBet({
            amount: betInfo.amount,
            player: betInfo.predictedWinner,
            placed: true,
            predictedWinner: betInfo.predictedWinner,
            claimed: betInfo.claimed,
            timestamp: betInfo.timestamp
          })
          console.log('📝 Fetched bet from contract:', betInfo)
        }
      } else {
        setUserBet(null)
        console.log('📝 No bet found for this user on this game')
      }
    } catch (error) {
      console.error('Failed to fetch user bet from contract:', error)
      // Fallback to localStorage if contract fails
      try {
        const savedBet = localStorage.getItem(`bet_${gameId}_${address}`)
        if (savedBet) {
          const betData = JSON.parse(savedBet)
          setUserBet({
            ...betData,
            predictedWinner: betData.player,
            claimed: false,
            timestamp: betData.timestamp || Date.now()
          })
          console.log('📝 Restored bet from localStorage (fallback):', betData)
        }
      } catch (localError) {
        console.error('Failed to restore bet from localStorage:', localError)
      }
    }
  }, [gameId, address, contractsReady, hasUserBetOnGame, getUserBetInfo])

  // Fetch all user's bets from localStorage (temporary solution)
  const fetchAllUserBets = useCallback(() => {
    if (!address) return []
    
    const allBets: Array<{
      gameId: string
      amount: string
      player: string
      placed: boolean
      timestamp: number
    }> = []
    
    // Scan localStorage for all bets by this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('bet_') && key.includes(address)) {
        try {
          const betData = JSON.parse(localStorage.getItem(key) || '{}')
          const gameId = key.split('_')[1]
          allBets.push({
            gameId,
            amount: betData.amount,
            player: betData.player,
            placed: betData.placed,
            timestamp: betData.timestamp || Date.now()
          })
        } catch (error) {
          console.error('Failed to parse bet data:', error)
        }
      }
    }
    
    return allBets.sort((a, b) => b.timestamp - a.timestamp) // Most recent first
  }, [address])

  // Calculate potential reward based on betting odds
  const calculatePotentialReward = (betAmount: string, selectedPlayer: string) => {
    if (!bettingInfo || !betAmount || parseFloat(betAmount) <= 0) {
      return "0.00"
    }

    const betAmountNum = parseFloat(betAmount)
    const totalBetsOnPlayer = parseFloat(bettingInfo.totalBetAmount) || 0
    
    if (totalBetsOnPlayer === 0) {
      // If no one else has bet on this player, you get 97% of your bet back
      return (betAmountNum * 0.97).toFixed(4)
    }
    
    // Calculate your share of the total bets on this player
    const yourShare = betAmountNum / (totalBetsOnPlayer + betAmountNum)
    
    // Calculate total prize pool (97% of all bets)
    const totalPrizePool = (parseFloat(bettingInfo.totalBetAmount) + betAmountNum) * 0.97
    
    // Your reward is your share of the prize pool
    const reward = totalPrizePool * yourShare
    
    return reward.toFixed(4)
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

  const handleMakeMove = async () => {
    if (!isActionAllowed()) {
      toast.error("Move not allowed at this time")
      return
    }
    
    const move = parseInt(moveAmount)
    if (isNaN(move) || move < 1) {
      toast.error("Please enter a valid move (must be 1 or greater)")
      return
    }

    try {
      const result = await makeMove(gameId!, move)
      if (result.success) {
        setMoveAmount("")
        toast.success(`Move submitted: ${move}`)
        
        // Wait a bit for blockchain confirmation then refresh
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Battle Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${gameConfig.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <gameConfig.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl font-black text-white">{gameState.mode}</CardTitle>
                      <p className="text-slate-300 font-medium">Battle #{gameState.gameId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
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
                          <div>gameStuck: <span className={gameState.gameStuck ? "text-red-400" : "text-green-400"}>{gameState.gameStuck ? "YES" : "NO"}</span></div>
                        </div>
                        <div>
                          <div>currentPlayer: <span className="text-white">{gameState.currentPlayer?.slice(0, 8)}...</span></div>
                          <div>yourAddress: <span className="text-white">{address?.slice(0, 8)}...</span></div>
                          <div>yourTimeouts: <span className="text-yellow-400">{gameState.yourTimeouts}/2</span></div>
                          <div>oppTimeouts: <span className="text-yellow-400">{gameState.opponentTimeouts}/2</span></div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-slate-800/40 rounded">
                        <div className="font-bold text-yellow-400 mb-1">TURN ANALYSIS:</div>
                        <div>currentPlayer === yourAddress: <span className={gameState.currentPlayer?.toLowerCase() === address?.toLowerCase() ? "text-green-400" : "text-red-400"}>
                          {gameState.currentPlayer?.toLowerCase() === address?.toLowerCase() ? "YES" : "NO"}
                        </span></div>
                        <div>actionAllowed: <span className={isActionAllowed() ? "text-green-400" : "text-red-400"}>
                          {isActionAllowed() ? "YES" : "NO"}
                        </span></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                        : "This battle is waiting for a second player."}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Entry Fee: {parseFloat(gameState.entryFee).toFixed(4)} MNT • Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} MNT
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
                          {transactionLoading ? "JOINING..." : `JOIN BATTLE (${parseFloat(gameState.entryFee).toFixed(4)} MNT)`}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Game */}
            {(gameState.status as string) === "active" && (
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

                  {/* Game Controls - Only show for players in the game */}
                  {gameState.isUserInGame && (
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
                            onClick={() => {
                              setMoveAmount("1")
                              handleMakeMove()
                            }}
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
                  </div>
                )}

                  {/* Spectator Betting Interface */}
                  {!gameState.isUserInGame && (gameState.status as string) === "active" && (
                    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-purple-400 flex items-center">
                            <Coins className="w-5 h-5 mr-2" />
                            SPECTATOR BETTING
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => {
                                fetchEnhancedBettingStats()
                                fetchBettingHistory()
                              }}
                              variant="outline"
                              size="sm"
                              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                              disabled={isLoading}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                              Refresh
                            </Button>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              🎲 LIVE
                            </Badge>
                          </div>
                        </div>
                        
                        {/* ✅ NEW: Betting Status Display */}
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
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
                          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                            <p className="text-xs font-bold text-slate-400 mb-1">GAME BETTING INFO</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-white">Total Bets: {bettingInfo.totalBetAmount} MNT</p>
                              <p className="text-white">Number of Bets: {bettingInfo.numberOfBets}</p>
                            </div>
                          </div>
                        )}

                        {/* ✅ NEW: Enhanced Betting Stats */}
                        {enhancedBettingInfo && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                            <p className="text-xs font-bold text-blue-400 mb-1">DETAILED BETTING STATS</p>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-slate-400">Total Amount:</p>
                                  <p className="text-white font-bold">{enhancedBettingInfo.totalBetAmount} MNT</p>
                                </div>
                                <div>
                                  <p className="text-slate-400">Unique Bettors:</p>
                                  <p className="text-white font-bold">{enhancedBettingInfo.numberOfUniqueBettors}</p>
                                </div>
                              </div>
                              
                              {enhancedBettingInfo.players.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-slate-400 text-xs mb-1">PLAYER BETTING BREAKDOWN:</p>
                                  <div className="space-y-1">
                                    {enhancedBettingInfo.players.map((player, index) => (
                                      <div key={index} className="flex justify-between text-xs">
                                        <span className="text-cyan-400">
                                          {player === gameState.players[0] ? "Creator" : "Opponent"}
                                        </span>
                                        <span className="text-white">
                                          {enhancedBettingInfo.playerBetAmounts[index]} MNT ({enhancedBettingInfo.playerBetCounts[index]} bets)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* State 1: No Bet Yet - Show Betting Interface */}
                        {!userBet && (
                          <div className="space-y-4">
                            <p className="text-slate-300 text-center">
                              Choose a player and place your bet to start spectating with stakes!
                            </p>
                            
                            {/* Player Selection */}
                            <div className="grid grid-cols-2 gap-3">
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
                                className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl text-lg font-bold flex-1"
                              />
                              
                              {/* Enhanced Profit Calculator */}
                              {betAmount && parseFloat(betAmount) > 0 && selectedPlayer && (
                                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                                  <p className="text-xs font-bold text-blue-400 mb-3 text-center">💰 PROFIT CALCULATOR</p>
                                  
                                  {/* Basic Info */}
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="text-center">
                                      <p className="text-xs text-slate-400">Your Bet</p>
                                      <p className="text-white font-bold">{betAmount} MNT</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-slate-400">Betting On</p>
                                      <p className="text-cyan-400 font-bold">
                                        {selectedPlayer === gameState.players[0] ? "Creator" : "Opponent"}
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
                                          <span className="text-white">{profitData.totalPrizePool} MNT</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">House Fee (3%):</span>
                                          <span className="text-red-400">-{profitData.houseFee} MNT</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Your Share:</span>
                                          <span className="text-blue-400">{profitData.yourShare}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Potential Winnings:</span>
                                          <span className="text-emerald-400">{profitData.potentialWinnings} MNT</span>
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
                                              {profitData.potentialProfit} MNT
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
                              {bettingLoading ? "PLACING BET..." : `PLACE BET (${betAmount} MNT)`}
                            </Button>
                          </div>
                        )}
                        
                        {/* State 2: Bet Placed - Show Active Bet Status */}
                        {userBet && (
                          <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                              <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Coins className="w-8 h-8 text-blue-400" />
                              </div>
                              <h3 className="text-xl font-bold text-blue-400 mb-2">🎯 BET PLACED!</h3>
                              <p className="text-white mb-3">
                                You bet <span className="font-bold text-emerald-400">{userBet.amount} MNT</span> on{' '}
                                <span className="font-bold text-cyan-400">
                                  {userBet.player === gameState.players[0] ? "Creator" : "Opponent"}
                                </span>
                              </p>
                              <p className="text-blue-300 text-sm">
                                Wait for the game to finish to see if you won!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* State 3: Game Completed - Show Bet Result */}
                    {!gameState.isUserInGame && (gameState.status as string) === "completed" && userBet && (
                      <div className="bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-violet-400 flex items-center">
                            <Trophy className="w-5 h-5 mr-2" />
                            BET RESULT
                          </h3>
                          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                            GAME FINISHED
                          </Badge>
                        </div>
                        
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
                                        <p className="text-white font-bold">{winningsData.originalBet} MNT</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-xs text-emerald-300">Total Winnings</p>
                                        <p className="text-emerald-400 font-bold text-lg">{winningsData.winnings} MNT</p>
                                      </div>
                                    </div>
                                    
                                    {/* Detailed Breakdown */}
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-emerald-300">Total Game Bets:</span>
                                        <span className="text-white">{winningsData.totalGameBets} MNT</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-emerald-300">House Fee (3%):</span>
                                        <span className="text-red-400">-{winningsData.houseFee} MNT</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-emerald-300">Prize Pool:</span>
                                        <span className="text-white">{winningsData.prizePool} MNT</span>
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
                                          +{winningsData.profit} MNT
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
                      </div>
                    )}

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

                    {/* ✅ NEW: Betting History Section */}
                    {bettingHistory.gameIds.length > 0 && (
                      <div className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 border border-indigo-500/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-indigo-400 flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            YOUR BETTING HISTORY
                          </h3>
                          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            📚 {bettingHistory.gameIds.length} BETS
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {bettingHistory.gameIds.map((gameId, index) => (
                            <div key={index} className="bg-slate-800/40 border border-slate-600/30 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
                                      <span className="text-indigo-400 text-xs font-bold">#{gameId}</span>
                                    </div>
                                    <div>
                                      <p className="text-white font-bold">Game #{gameId}</p>
                                      <p className="text-slate-400 text-sm">
                                        Bet: {bettingHistory.amounts[index]} MNT on{' '}
                                        <span className="text-cyan-400">
                                          {bettingHistory.predictedWinners[index]?.slice(0, 8)}...
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="flex items-center space-x-2">
                                    <Badge className={`${
                                      bettingHistory.claimed[index]
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    }`}>
                                      {bettingHistory.claimed[index] ? "✅ CLAIMED" : "⏳ PENDING"}
                                    </Badge>
                                  </div>
                                  <p className="text-slate-400 text-xs mt-1">
                                    {new Date(bettingHistory.timestamps[index] * 1000).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 text-center">
                          <Button
                            onClick={() => router.push("/my-bets")}
                            variant="outline"
                            size="sm"
                            className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                          >
                            View All Bets
                          </Button>
                        </div>
                      </div>
                    )}

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
                      Final number: {gameState.currentNumber} • Prize Pool: {parseFloat(gameState.prizePool).toFixed(4)} MNT
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
                    <p className="font-black text-cyan-400">{parseFloat(gameState.entryFee).toFixed(4)} MNT</p>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
                    <p className="font-black text-emerald-400">{parseFloat(gameState.prizePool).toFixed(4)} MNT</p>
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
                        <p className="text-white">Total Bets: {bettingInfo.totalBetAmount} MNT</p>
                        <p className="text-white">Number of Bets: {bettingInfo.numberOfBets}</p>
                      </div>
                    </div>
                  )}

                  {/* Current Bet Display - Clear State Management */}
                  {userBet && (
                    <div className={`rounded-lg p-3 border ${
                      gameState.status === "completed" 
                        ? "bg-emerald-500/10 border-emerald-500/30" 
                        : "bg-blue-500/10 border-blue-500/30"
                    }`}>
                      <p className={`text-xs font-bold mb-1 ${
                        gameState.status === "completed" 
                          ? "text-emerald-400" 
                          : "text-blue-400"
                      }`}>
                        {gameState.status === "completed" ? "BET RESULT" : "ACTIVE BET"}
                      </p>
                      <p className="text-white text-sm">
                        {userBet.amount} MNT on {userBet.player.slice(0, 8)}...
                      </p>
                      <p className={`text-xs mt-1 ${
                        gameState.status === "completed" 
                          ? "text-emerald-300" 
                          : "text-blue-300"
                      }`}>
                        {gameState.status === "completed" 
                          ? "Game finished - check result below!" 
                          : "Bet is active - wait for game to finish!"
                        }
                      </p>
                    </div>
                  )}
                  
                  {/* Bet Result Display - Only show when game is completed */}
                  {userBet && gameState.status === "completed" && (
                    <div className="mt-3">
                      {userBet.player.toLowerCase() === gameState.winner?.toLowerCase() ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-emerald-400 font-bold">🎉 WIN!</p>
                          <Button
                            onClick={handleClaimWinnings}
                            disabled={bettingLoading}
                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            size="sm"
                          >
                            {bettingLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trophy className="w-4 h-4 mr-2" />
                            )}
                            {bettingLoading ? "CLAIMING..." : "CLAIM WINNINGS"}
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-red-400 font-bold">❌ LOST</p>
                        </div>
                      )}
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



                  {/* Betting History */}
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400">BETTING HISTORY</p>
                      <Button
                        onClick={() => setShowBettingHistory(!showBettingHistory)}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-400 hover:bg-slate-600/50 text-xs px-2 py-1"
                      >
                        {showBettingHistory ? "Hide" : "Show"}
                      </Button>
                    </div>
                    
                    {showBettingHistory && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {fetchAllUserBets().map((bet, index) => (
                          <div key={index} className="bg-slate-800/40 rounded p-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300">Game #{bet.gameId}</span>
                              <span className="text-emerald-400 font-bold">{bet.amount} MNT</span>
                            </div>
                            <div className="text-slate-400 text-xs">
                              Bet on: {bet.player.slice(0, 6)}...
                            </div>
                            <Button
                              onClick={() => router.push(`/battle/${bet.gameId}`)}
                              variant="outline"
                              size="sm"
                              className="w-full mt-1 border-slate-600 text-slate-400 hover:bg-slate-600/50 text-xs py-1"
                            >
                              View Game
                            </Button>
                          </div>
                        ))}
                        
                        {fetchAllUserBets().length === 0 && (
                          <p className="text-slate-400 text-xs text-center">No betting history yet</p>
                        )}
                      </div>
                    )}
                  </div>

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
                        <p className="font-black text-emerald-400">{parseFloat(userBalance).toFixed(4)} MNT</p>
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