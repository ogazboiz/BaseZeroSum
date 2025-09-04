// hooks/useGameState.ts - IMPROVED for better battle page flow
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useZeroSumData, useZeroSumContract, GameStatus, GameMode } from './useZeroSumContract'
import { toast } from 'react-hot-toast'


export interface GameState {
  // Core game data
  gameId: number
  status: 'waiting' | 'active' | 'completed'
  mode: 'Quick Draw' | 'Strategic'
  currentNumber: number
  currentPlayer: string
  winner: string | null
  numberGenerated: boolean
  
  // Players
  players: string[]
  creator: string
  opponent: string | null
  
  // Financial
  entryFee: string
  prizePool: string
  platformFee: number
  
  // User relationship
  isUserInGame: boolean
  isUserCreator: boolean
  isUserOpponent: boolean
  isMyTurn: boolean
  canJoin: boolean
  
  // Timing
  timeLeft: number
  turnDeadline: number
  lastUpdate: number
  isStuck: boolean
  autoTimeoutCountdown: number
  
  // Moves and history
  moves: GameMove[]
  timeouts: {
    user: number
    opponent: number
  }
  
  // Money/Prize info
  userBalance: string
  canWithdraw: boolean
  pendingWinnings: string
  hasWon: boolean
}

export interface GameMove {
  player: string
  move: number | 'TIMEOUT'
  oldNumber: number
  newNumber: number
  timestamp: string
  txHash?: string
}

// Hook initialization states
type HookState = 'idle' | 'initializing' | 'ready' | 'error' | 'disabled'

export function useGameState(gameId: string | number) {
  const { address, isConnected } = useAccount()
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
    withdraw
  } = useZeroSumContract()

  // State management
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [hookState, setHookState] = useState<HookState>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for cleanup and state management
  const mountedRef = useRef(true)
  const fetchAttemptRef = useRef(0)
  const lastSuccessfulFetchRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validation
  const isValidGameId = gameId && (typeof gameId === 'string' ? gameId !== '' : gameId >= 0)
  const canInitialize = isValidGameId && isConnected && address && contractsReady && providerReady

  // Initialize hook state
  useEffect(() => {
    if (!isValidGameId) {
      setHookState('disabled')
      return
    }

    if (!isConnected || !address) {
      setHookState('disabled')
      setError('Wallet not connected')
      return
    }

    if (!contractsReady || !providerReady) {
      setHookState('initializing')
      setError('Connecting to blockchain...')
      return
    }

    setHookState('ready')
    setError(null)
  }, [isValidGameId, isConnected, address, contractsReady, providerReady])

  // Enhanced fetch with better error handling and retry logic
  const fetchGameState = useCallback(async (force = false) => {
    if (!canInitialize || hookState === 'disabled') return
    if (isLoading && !force) return

    const now = Date.now()
    const timeSinceLastFetch = now - lastSuccessfulFetchRef.current
    
    // Throttle requests (15 seconds for non-forced requests)
    if (!force && timeSinceLastFetch < 15000) return

    fetchAttemptRef.current += 1
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🎮 [useGameState] Fetching game ${gameId} (attempt ${fetchAttemptRef.current})`)
      
      // Step 1: Validate game exists
      const gameData = await getGame(Number(gameId))
      if (!mountedRef.current) return

      if (!gameData) {
        throw new Error(`Game #${gameId} not found on blockchain`)
      }

      // Step 2: Get players
      const players = await getPlayers(Number(gameId))
      if (!mountedRef.current) return

      console.log(`🎮 [useGameState] Game ${gameId} - Status: ${gameData.status}, Players: ${players.length}`)

      // Step 3: Determine user relationship
      const isUserInGame = players.some(p => p.toLowerCase() === address.toLowerCase())
      const isUserCreator = players[0]?.toLowerCase() === address.toLowerCase()
      const isUserOpponent = players[1]?.toLowerCase() === address.toLowerCase()
      const canJoin = !isUserInGame && players.length < 2 && gameData.status === GameStatus.WAITING

      // Step 4: Get player view for timing (only if user is in game and game is active)
      let playerView = null
      let isMyTurn = false
      let timeLeft = 0
      let timeouts = { user: 0, opponent: 0 }

      if (isUserInGame && gameData.status === GameStatus.ACTIVE) {
        try {
          playerView = await getPlayerView(Number(gameId))
          if (playerView && mountedRef.current) {
            isMyTurn = gameData.currentPlayer.toLowerCase() === address.toLowerCase()
            timeLeft = playerView.timeLeft
            timeouts = {
              user: playerView.yourTimeouts,
              opponent: playerView.opponentTimeouts
            }
          }
        } catch (viewError) {
          console.warn(`[useGameState] Could not get player view for game ${gameId}:`, viewError)
          // Don't fail the entire fetch for player view errors
        }
      }

      // Step 5: Get user balance
      let userBalance = "0"
      try {
        userBalance = await getPlayerBalance(address)
      } catch (balanceError) {
        console.warn(`[useGameState] Could not get balance:`, balanceError)
      }

      // Step 6: Calculate derived data
      const hasWon = gameData.status === GameStatus.FINISHED && 
                    gameData.winner && 
                    gameData.winner.toLowerCase() === address.toLowerCase()
      
      const pendingWinnings = hasWon ? gameData.prizePool : "0"
      const canWithdraw = parseFloat(userBalance) > 0
      const isStuck = gameData.status === GameStatus.ACTIVE && timeLeft === 0

      // Step 7: Build complete game state
      const newGameState: GameState = {
        gameId: Number(gameId),
        status: gameData.status === GameStatus.WAITING ? 'waiting' :
                gameData.status === GameStatus.ACTIVE ? 'active' : 'completed',
        mode: gameData.mode === GameMode.QUICK_DRAW ? 'Quick Draw' : 'Strategic',
        currentNumber: Number(gameData.currentNumber),
        currentPlayer: gameData.currentPlayer,
        winner: gameData.winner && gameData.winner !== ethers.ZeroAddress ? gameData.winner : null,
        numberGenerated: gameData.numberGenerated,
        
        players,
        creator: players[0] || "",
        opponent: players[1] || null,
        
        entryFee: gameData.entryFee,
        prizePool: gameData.prizePool,
        platformFee: 5,
        
        isUserInGame,
        isUserCreator,
        isUserOpponent,
        isMyTurn,
        canJoin,
        
        timeLeft,
        turnDeadline: timeLeft > 0 ? now + (timeLeft * 1000) : 0,
        lastUpdate: now,
        isStuck,
        autoTimeoutCountdown: 0,
        
        moves: [], // TODO: Implement move history if needed
        timeouts,
        
        userBalance,
        canWithdraw,
        pendingWinnings,
        hasWon: Boolean(hasWon)
      }

      setGameState(newGameState)
      setHookState('ready')
      setError(null)
      lastSuccessfulFetchRef.current = now
      
      console.log(`✅ [useGameState] Game ${gameId} fetched successfully:`, {
        status: newGameState.status,
        isUserInGame: newGameState.isUserInGame,
        isMyTurn: newGameState.isMyTurn,
        timeLeft: newGameState.timeLeft,
        isStuck: newGameState.isStuck
      })

    } catch (error) {
      console.error(`❌ [useGameState] Error fetching game ${gameId}:`, error)
      
      if (mountedRef.current) {
        let errorMessage = 'Failed to load game'
        
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            errorMessage = `Game #${gameId} doesn't exist on the blockchain`
          } else if (error.message.includes('execution reverted')) {
            errorMessage = `Contract call failed for game #${gameId}`
          } else {
            errorMessage = error.message
          }
        }
        
        setError(errorMessage)
        setHookState('error')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [
    gameId, 
    address, 
    canInitialize, 
    hookState, 
    isLoading,
    getGame, 
    getPlayers, 
    getPlayerView, 
    getPlayerBalance
  ])

  // Auto-timeout mechanism
  useEffect(() => {
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current)
      autoTimeoutRef.current = null
    }

    if (!gameState?.isStuck || gameState.status !== 'active') return

    console.log('🚨 [useGameState] Game is stuck - starting auto-timeout')
    
    let countdown = 30
    setGameState(prev => prev ? { ...prev, autoTimeoutCountdown: countdown } : null)

    const countdownInterval = setInterval(() => {
      countdown -= 1
      if (mountedRef.current) {
        setGameState(prev => prev ? { ...prev, autoTimeoutCountdown: countdown } : null)
      }
      
      if (countdown <= 0) {
        clearInterval(countdownInterval)
      }
    }, 1000)

    autoTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return

      try {
        console.log('🤖 [useGameState] Auto-timeout triggered')
        const result = await handleTimeout(Number(gameId))
        
        if (result.success) {
          toast.success('⏰ Game unstuck automatically!')
          // Refresh game state after timeout
          setTimeout(() => {
            if (mountedRef.current) {
              fetchGameState(true)
            }
          }, 3000)
        }
      } catch (error) {
        console.error('[useGameState] Auto-timeout failed:', error)
        toast.error('⚠️ Auto-timeout failed. Please manually force timeout.')
      }
    }, 30000)

    return () => {
      clearInterval(countdownInterval)
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current)
        autoTimeoutRef.current = null
      }
    }
  }, [gameState?.isStuck, gameState?.status, gameId, handleTimeout, fetchGameState])

  // Timer countdown effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'active' || gameState.timeLeft <= 0) return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.status !== 'active') return prev
        
        const now = Date.now()
        const timeLeft = Math.max(0, Math.floor((prev.turnDeadline - now) / 1000))
        const isStuck = timeLeft === 0 && prev.status === 'active'
        
        return { 
          ...prev, 
          timeLeft,
          isStuck: isStuck || prev.isStuck
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState?.status, gameState?.turnDeadline])

  // Initial fetch and polling setup
  useEffect(() => {
    if (hookState === 'ready') {
      fetchGameState(true)
      
      // Set up polling - less aggressive than before
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        if (hookState === 'ready' && !error && mountedRef.current) {
          // Only poll active games, and less frequently
          if (gameState?.status === 'active') {
            fetchGameState()
          }
        }
      }, 90000) // Poll every 90 seconds for active games only (reduced from 45s)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hookState, fetchGameState, error, gameState?.status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current)
        autoTimeoutRef.current = null
      }
    }
  }, [])

  // Action handlers with enhanced error handling
  const joinGameAction = useCallback(async () => {
    if (!gameState || !gameState.canJoin) {
      toast.error("Cannot join this game")
      return false
    }

    if (hookState !== 'ready') {
      toast.error("Blockchain connection not ready")
      return false
    }

    try {
      console.log(`🎮 [useGameState] Joining game ${gameId} with fee ${gameState.entryFee}`)
      const result = await joinGame(Number(gameId), gameState.entryFee)
      
      if (result.success) {
        toast.success("Successfully joined the game!")
        // Refresh state after successful join
        setTimeout(() => fetchGameState(true), 3000)
        return true
      }
      return false
    } catch (error) {
      console.error('[useGameState] Failed to join game:', error)
      toast.error('Failed to join game')
      return false
    }
  }, [gameState, gameId, hookState, joinGame, fetchGameState])

  const makeMoveAction = useCallback(async (subtraction: number) => {
    if (!gameState || !gameState.isMyTurn) {
      toast.error("It's not your turn!")
      return false
    }

    if (hookState !== 'ready') {
      toast.error("Blockchain connection not ready")
      return false
    }

    // Validate move based on game mode
    if (gameState.mode === 'Quick Draw' && subtraction !== 1) {
      toast.error("Quick Draw: You can only subtract 1!")
      return false
    }

    if (gameState.mode === 'Strategic') {
      const min = Math.max(1, Math.ceil(gameState.currentNumber * 0.1))
      const max = Math.floor(gameState.currentNumber * 0.3)
      if (subtraction < min || subtraction > max) {
        toast.error(`Strategic: Subtract between ${min} and ${max}`)
        return false
      }
    }

    try {
      console.log(`🎯 [useGameState] Making move: subtract ${subtraction} from ${gameState.currentNumber}`)
      const result = await makeMove(Number(gameId), subtraction)
      
      if (result.success) {
        const newNumber = gameState.currentNumber - subtraction
        toast.success(`Move successful: ${gameState.currentNumber} - ${subtraction} = ${newNumber}`)
        
        // Update local state immediately for better UX
        setGameState(prev => prev ? {
          ...prev,
          currentNumber: newNumber,
          isMyTurn: false,
          timeLeft: 90 // Reset timer for opponent (contract uses 90 seconds)
        } : null)
        
        // Check for game end
        if (newNumber === 0) {
          if (gameState.mode === 'Quick Draw') {
            toast.success("🎉 You reached 0 and WON!")
          } else {
            toast.error("💀 You reached 0 and LOST!")
          }
        }
        
        // Refresh from blockchain
        setTimeout(() => fetchGameState(true), 3000)
        return true
      }
      return false
    } catch (error) {
      console.error('[useGameState] Failed to make move:', error)
      toast.error('Failed to make move')
      return false
    }
  }, [gameState, gameId, hookState, makeMove, fetchGameState])

  const handleTimeoutAction = useCallback(async (isAutomatic = false) => {
    if (hookState !== 'ready') {
      toast.error("Blockchain connection not ready")
      return false
    }

    try {
      console.log(`⏰ [useGameState] ${isAutomatic ? 'AUTOMATIC' : 'MANUAL'} timeout for game ${gameId}`)
      const result = await handleTimeout(Number(gameId))
      
      if (result.success) {
        if (isAutomatic) {
          toast.success("⏰ Game unstuck automatically!")
        } else {
          toast.success("⏰ Timeout processed successfully!")
        }
        
        // Clear stuck state immediately
        setGameState(prev => prev ? {
          ...prev,
          isStuck: false,
          autoTimeoutCountdown: 0
        } : null)
        
        setTimeout(() => fetchGameState(true), 2000)
        return true
      }
      return false
    } catch (error) {
      console.error('[useGameState] Failed to handle timeout:', error)
      if (!isAutomatic) {
        toast.error('Failed to handle timeout')
      }
      return false
    }
  }, [gameId, hookState, handleTimeout, fetchGameState])

  const cancelAutoTimeout = useCallback(() => {
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current)
      autoTimeoutRef.current = null
    }
    
    setGameState(prev => prev ? {
      ...prev,
      autoTimeoutCountdown: 0
    } : null)
    
    toast.info("Auto-timeout cancelled")
  }, [])

  const withdrawWinnings = useCallback(async () => {
    if (!gameState || !gameState.canWithdraw) {
      toast.error("No balance to withdraw")
      return false
    }

    if (hookState !== 'ready') {
      toast.error("Blockchain connection not ready")
      return false
    }

    try {
      console.log(`💰 [useGameState] Withdrawing balance: ${gameState.userBalance} ETH`)
      const result = await withdraw()
      
      if (result.success) {
        toast.success(`Successfully withdrew ${gameState.userBalance} ETH!`)
        // Update local state immediately
        setGameState(prev => prev ? {
          ...prev,
          userBalance: "0",
          canWithdraw: false,
          pendingWinnings: "0"
        } : null)
        // Refresh to confirm
        setTimeout(() => fetchGameState(true), 3000)
        return true
      }
      return false
    } catch (error) {
      console.error('[useGameState] Failed to withdraw:', error)
      toast.error('Failed to withdraw winnings')
      return false
    }
  }, [gameState, hookState, withdraw, fetchGameState])

  // Manual refresh
  const refresh = useCallback(() => {
    if (hookState === 'ready') {
      fetchAttemptRef.current = 0 // Reset attempt counter
      fetchGameState(true)
    }
  }, [hookState, fetchGameState])

  // Computed loading state - be more specific about what's loading
  const computedIsLoading = hookState === 'initializing' || (hookState === 'ready' && isLoading)

  return {
    // Core state
    gameState,
    isLoading: computedIsLoading,
    error,
    hookState,
    
    // Actions
    joinGame: joinGameAction,
    makeMove: makeMoveAction,
    handleTimeout: handleTimeoutAction,
    cancelAutoTimeout,
    withdrawWinnings,
    refresh,
    
    // Computed values
    isSpectator: !gameState?.isUserInGame,
    needsAction: gameState?.isMyTurn && gameState?.status === 'active' && gameState?.timeLeft > 0,
    gameEnded: gameState?.status === 'completed',
    userWon: gameState?.hasWon,
    canPlay: gameState?.isUserInGame && gameState?.status === 'active' && hookState === 'ready',
    
    // Financial info
    userBalance: gameState?.userBalance || "0",
    pendingWinnings: gameState?.pendingWinnings || "0",
    canWithdraw: gameState?.canWithdraw || false,
    totalPrizePool: gameState?.prizePool || "0",
    
    // Connection info
    isReady: hookState === 'ready',
    isDisabled: hookState === 'disabled',
    isInitializing: hookState === 'initializing',
    hasError: hookState === 'error'
  }
}