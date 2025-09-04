// hooks/useContractEvents.ts - Event Listener System
import { useEffect, useRef, useCallback } from 'react'
import { usePublicClient } from 'wagmi'


const GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS || "0xfb40c6BACc74019E01C0dD5b434CE896806D7579"

// Event signatures for the game contract
const EVENT_SIGNATURES = {
  GameCreated: "GameCreated(uint256,uint8,address,uint256)",
  PlayerJoined: "PlayerJoined(uint256,address)", 
  MoveMade: "MoveMade(uint256,address,uint256,uint256)",
  GameFinished: "GameFinished(uint256,address,uint256)",
  NumberGenerated: "NumberGenerated(uint256,uint256)"
}

interface GameEvent {
  type: 'GameCreated' | 'PlayerJoined' | 'MoveMade' | 'GameFinished' | 'NumberGenerated'
  gameId: number
  data: any
  blockNumber: number
  transactionHash: string
}

type EventCallback = (event: GameEvent) => void

// Global event system
class GameEventManager {
  private subscribers: Map<string, Set<EventCallback>> = new Map()
  private isListening: boolean = false
  private publicClient: any = null
  private unsubscribe: (() => void) | null = null

  subscribe(gameId: number | 'all', callback: EventCallback): () => void {
    const key = gameId.toString()
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    // Start listening if this is the first subscriber
    if (!this.isListening && this.publicClient) {
      this.startListening()
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(key)
        }
      }
      
      // Stop listening if no more subscribers
      if (this.subscribers.size === 0 && this.isListening) {
        this.stopListening()
      }
    }
  }

  setPublicClient(client: any) {
    this.publicClient = client
    if (this.subscribers.size > 0 && !this.isListening) {
      this.startListening()
    }
  }

  private startListening() {
    if (!this.publicClient || this.isListening) return

    console.log('🎧 Starting to listen for contract events')
    this.isListening = true

    // Listen to all contract events
    this.unsubscribe = this.publicClient.watchContractEvent({
      address: GAME_CONTRACT_ADDRESS,
      abi: [
        'event GameCreated(uint256 indexed gameId, uint8 mode, address creator, uint256 entryFee)',
        'event PlayerJoined(uint256 indexed gameId, address player)',
        'event MoveMade(uint256 indexed gameId, address player, uint256 subtraction, uint256 newNumber)',
        'event GameFinished(uint256 indexed gameId, address winner, uint256 earnings)',
        'event NumberGenerated(uint256 indexed gameId, uint256 number)'
      ],
      onLogs: (logs: any[]) => {
        for (const log of logs) {
          this.handleEvent(log)
        }
      }
    })
  }

  private stopListening() {
    if (this.unsubscribe) {
      console.log('🔇 Stopping contract event listener')
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.isListening = false
  }

  private handleEvent(log: any) {
    try {
      const gameId = Number(log.args.gameId)
      const event: GameEvent = {
        type: log.eventName,
        gameId,
        data: log.args,
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash
      }

      console.log(`🎮 Event: ${event.type} for game ${gameId}`, event.data)

      // Notify specific game subscribers
      const gameSubscribers = this.subscribers.get(gameId.toString())
      if (gameSubscribers) {
        gameSubscribers.forEach(callback => callback(event))
      }

      // Notify global subscribers
      const allSubscribers = this.subscribers.get('all')
      if (allSubscribers) {
        allSubscribers.forEach(callback => callback(event))
      }
    } catch (error) {
      console.error('Error handling event:', error)
    }
  }
}

// Global instance
const eventManager = new GameEventManager()

// Hook to use contract events
export function useContractEvents(gameId?: number) {
  const publicClient = usePublicClient()
  
  useEffect(() => {
    if (publicClient) {
      eventManager.setPublicClient(publicClient)
    }
  }, [publicClient])

  const subscribe = useCallback((callback: EventCallback) => {
    const key = gameId ?? 'all'
    return eventManager.subscribe(key, callback)
  }, [gameId])

  return { subscribe }
}

// hooks/useGameState.ts - EVENT-DRIVEN VERSION
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useZeroSumData, useZeroSumContract, GameStatus, GameMode } from './useZeroSumContract'
import { toast } from 'react-hot-toast'

import { useContractEvents } from './useContractEvents'

export interface GameState {
  gameId: number
  status: 'waiting' | 'active' | 'completed'
  mode: 'Quick Draw' | 'Strategic'
  currentNumber: number
  currentPlayer: string
  winner: string | null
  numberGenerated: boolean
  
  players: string[]
  creator: string
  opponent: string | null
  
  entryFee: string
  prizePool: string
  platformFee: number
  
  isUserInGame: boolean
  isUserCreator: boolean
  isUserOpponent: boolean
  isMyTurn: boolean
  canJoin: boolean
  
  timeLeft: number
  turnDeadline: number
  lastUpdate: number
  isStuck: boolean
  autoTimeoutCountdown: number
  
  moves: GameMove[]
  timeouts: {
    user: number
    opponent: number
  }
  
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

export function useGameState(gameId: string | number) {
  const { address, isConnected } = useAccount()
  const { 
    getGame, 
    getPlayers, 
    getPlayerView, 
    getPlayerBalance 
  } = useZeroSumData()
  
  const {
    joinGame,
    makeMove,
    handleTimeout,
    withdraw
  } = useZeroSumContract()

  const { subscribe } = useContractEvents(Number(gameId))

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const mountedRef = useRef(true)
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stuckGameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoTimeoutTriggeredRef = useRef(false)
  const lastAddressRef = useRef<string | undefined>(address)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Clear state when address changes
  useEffect(() => {
    if (lastAddressRef.current !== address) {
      console.log(`🔄 Account changed, resetting game state`)
      lastAddressRef.current = address
      setGameState(null)
      setIsLoading(true)
      setError(null)
      autoTimeoutTriggeredRef.current = false
    }
  }, [address])

  // Fetch complete game state (ONLY CALLED ON EVENTS OR INITIAL LOAD)
  const fetchGameState = useCallback(async () => {
    if (!gameId || !mountedRef.current || !isConnected) return
    
    try {
      console.log(`🎮 Fetching game state for ${gameId}`)
      
      const [gameData, players, userBalance] = await Promise.all([
        getGame(Number(gameId)),
        getPlayers(Number(gameId)),
        address ? getPlayerBalance(address) : Promise.resolve("0")
      ])

      if (!mountedRef.current) return

      if (!gameData) {
        throw new Error(`Game ${gameId} not found`)
      }

      const isUserInGame = address ? players.some(p => p.toLowerCase() === address.toLowerCase()) : false
      const isUserCreator = address ? players[0]?.toLowerCase() === address.toLowerCase() : false
      const isUserOpponent = address ? players[1]?.toLowerCase() === address.toLowerCase() : false
      const canJoin = !isUserInGame && players.length < 2 && gameData.status === GameStatus.WAITING

      // Get player view for timing and turn info
      let playerView = null
      let isMyTurn = false
      let timeLeft = 0
      let timeouts = { user: 0, opponent: 0 }

      if (isUserInGame && gameData.status === GameStatus.ACTIVE) {
        try {
          playerView = await getPlayerView(Number(gameId))
          if (playerView && mountedRef.current) {
            isMyTurn = gameData.currentPlayer.toLowerCase() === address?.toLowerCase()
            timeLeft = playerView.timeLeft
            timeouts = {
              user: playerView.yourTimeouts,
              opponent: playerView.opponentTimeouts
            }
          }
        } catch (viewError) {
          console.warn(`Could not get player view:`, viewError)
        }
      }

      const hasWon = gameData.status === GameStatus.FINISHED && 
                    gameData.winner && 
                    gameData.winner.toLowerCase() === address?.toLowerCase()
      
      const pendingWinnings = hasWon ? gameData.prizePool : "0"
      const canWithdraw = parseFloat(userBalance) > 0
      const isStuck = gameData.status === GameStatus.ACTIVE && timeLeft === 0

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
        turnDeadline: timeLeft > 0 ? Date.now() + (timeLeft * 1000) : 0,
        lastUpdate: Date.now(),
        isStuck,
        autoTimeoutCountdown: 0,
        
        moves: gameState?.moves || [],
        timeouts,
        
        userBalance,
        canWithdraw,
        pendingWinnings,
        hasWon: Boolean(hasWon)
      }

      setGameState(newGameState)
      setIsLoading(false)
      
      console.log(`✅ Game state updated:`, {
        gameId: newGameState.gameId,
        status: newGameState.status,
        isMyTurn: newGameState.isMyTurn,
        isStuck: newGameState.isStuck
      })

    } catch (error) {
      console.error(`❌ Error fetching game state:`, error)
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to load game')
        setIsLoading(false)
      }
    }
  }, [gameId, address, isConnected, getGame, getPlayers, getPlayerView, getPlayerBalance])

  // Listen to contract events for real-time updates
  useEffect(() => {
    if (!gameId || !isConnected) return

    console.log(`🎧 Setting up event listeners for game ${gameId}`)

    const unsubscribe = subscribe((event) => {
      console.log(`📡 Received event: ${event.type} for game ${event.gameId}`)
      
      // Update game state based on event
      if (event.type === 'PlayerJoined') {
        toast.success('Player joined the game!')
        fetchGameState()
      } else if (event.type === 'MoveMade') {
        const { player, subtraction, newNumber } = event.data
        toast.success(`Move made: ${subtraction} subtracted`)
        
        // Optimistic update
        setGameState(prev => prev ? {
          ...prev,
          currentNumber: Number(newNumber),
          moves: [{
            player,
            move: Number(subtraction),
            oldNumber: prev.currentNumber,
            newNumber: Number(newNumber),
            timestamp: new Date().toLocaleTimeString(),
            txHash: event.transactionHash
          }, ...prev.moves]
        } : null)
        
        // Fetch full state after a short delay
        setTimeout(fetchGameState, 1000)
      } else if (event.type === 'GameFinished') {
        const { winner } = event.data
        toast.success(`🎉 Game finished! Winner: ${winner}`)
        fetchGameState()
      } else if (event.type === 'NumberGenerated') {
        toast.success('Game started! Number generated.')
        fetchGameState()
      }
    })

    return unsubscribe
  }, [gameId, isConnected, subscribe, fetchGameState])

  // Initial load
  useEffect(() => {
    if (isConnected && gameId) {
      fetchGameState()
    } else {
      setIsLoading(false)
    }
  }, [gameId, isConnected, address, fetchGameState])

  // Countdown timer (only when active)
  useEffect(() => {
    if (!gameState || gameState.status !== 'active' || gameState.timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.status !== 'active') return prev
        
        const now = Date.now()
        const timeLeft = Math.max(0, Math.floor((prev.turnDeadline - now) / 1000))
        const isStuck = timeLeft === 0 && prev.status === 'active'
        
        if (isStuck && !prev.isStuck) {
          autoTimeoutTriggeredRef.current = false
        }
        
        return { ...prev, timeLeft, isStuck: isStuck || prev.isStuck }
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameState?.status, gameState?.turnDeadline])

  // Auto-timeout mechanism
  useEffect(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current)
    if (stuckGameTimerRef.current) clearInterval(stuckGameTimerRef.current)

    if (!gameState?.isStuck || gameState.status !== 'active' || autoTimeoutTriggeredRef.current) {
      return
    }

    console.log('🚨 Game stuck - starting auto-timeout')
    autoTimeoutTriggeredRef.current = true
    
    let countdown = 30
    setGameState(prev => prev ? { ...prev, autoTimeoutCountdown: countdown } : null)

    stuckGameTimerRef.current = setInterval(() => {
      countdown -= 1
      if (mountedRef.current) {
        setGameState(prev => prev ? { ...prev, autoTimeoutCountdown: countdown } : null)
      }
      if (countdown <= 0 && stuckGameTimerRef.current) {
        clearInterval(stuckGameTimerRef.current)
        stuckGameTimerRef.current = null
      }
    }, 1000)

    autoTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return
      try {
        const result = await handleTimeout(Number(gameId))
        if (result.success) {
          toast.success('⏰ Game unstuck automatically!')
          autoTimeoutTriggeredRef.current = false
        }
      } catch (error) {
        console.error('Auto-timeout failed:', error)
        autoTimeoutTriggeredRef.current = false
      }
    }, 30000)

    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current)
      if (stuckGameTimerRef.current) clearInterval(stuckGameTimerRef.current)
    }
  }, [gameState?.isStuck, gameState?.status, gameId, handleTimeout])

  // Game actions
  const joinGameAction = useCallback(async () => {
    if (!gameState?.canJoin) return false
    try {
      setIsLoading(true)
      const result = await joinGame(Number(gameId), gameState.entryFee)
      if (result.success) {
        toast.success("Successfully joined!")
        // Event will trigger update
        return true
      }
      return false
    } catch (error) {
      console.error('Join failed:', error)
      toast.error('Failed to join game')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [gameState, gameId, joinGame])

  const makeMoveAction = useCallback(async (subtraction: number) => {
    if (!gameState?.isMyTurn) return false
    
    if (gameState.mode === 'Quick Draw' && subtraction !== 1) {
      toast.error("Quick Draw: Only subtract 1!")
      return false
    }
    if (gameState.mode === 'Strategic') {
      const min = Math.max(1, Math.ceil(gameState.currentNumber * 0.1))
      const max = Math.floor(gameState.currentNumber * 0.3)
      if (subtraction < min || subtraction > max) {
        toast.error(`Strategic: Subtract ${min}-${max}`)
        return false
      }
    }

    try {
      const result = await makeMove(Number(gameId), subtraction)
      if (result.success) {
        toast.success(`Move submitted!`)
        // Event will trigger update
        return true
      }
      return false
    } catch (error) {
      console.error('Move failed:', error)
      toast.error('Failed to make move')
      return false
    }
  }, [gameState, gameId, address, makeMove])

  const handleTimeoutAction = useCallback(async () => {
    try {
      const result = await handleTimeout(Number(gameId))
      if (result.success) {
        toast.success("⏰ Timeout processed!")
        autoTimeoutTriggeredRef.current = false
        // Update will come from event or timer
        return true
      }
      return false
    } catch (error) {
      console.error('Timeout failed:', error)
      toast.error('Failed to handle timeout')
      return false
    }
  }, [gameId, handleTimeout])

  const cancelAutoTimeout = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current)
    if (stuckGameTimerRef.current) clearInterval(stuckGameTimerRef.current)
    autoTimeoutTriggeredRef.current = false
    setGameState(prev => prev ? { ...prev, autoTimeoutCountdown: 0 } : null)
    toast.info("Auto-timeout cancelled")
  }, [])

  const withdrawWinnings = useCallback(async () => {
    if (!gameState?.canWithdraw) return false
    try {
      const result = await withdraw()
      if (result.success) {
        toast.success(`Withdrew ${gameState.userBalance} ETH!`)
        setGameState(prev => prev ? {
          ...prev,
          userBalance: "0",
          canWithdraw: false,
          pendingWinnings: "0"
        } : null)
        return true
      }
      return false
    } catch (error) {
      console.error('Withdraw failed:', error)
      toast.error('Failed to withdraw')
      return false
    }
  }, [gameState, withdraw])

  const refresh = useCallback(() => {
    autoTimeoutTriggeredRef.current = false
    fetchGameState()
  }, [fetchGameState])

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(() => {
    fetchMyGames()
  }, [fetchMyGames])

  const activeGames = myGames.filter(g => g.status === "active")
  const waitingGames = myGames.filter(g => g.status === "waiting")
  const completedGames = myGames.filter(g => g.status === "completed")
  const myTurnGames = myGames.filter(g => g.myTurn && g.status === "active")

  const hasUrgentActions = () => myTurnGames.length > 0

  return {
    myGames,
    stats,
    isLoading,
    error,
    debugInfo,
    refresh,
    activeGames,
    waitingGames,
    completedGames,
    myTurnGames,
    hasUrgentActions
  }
}
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current)
      if (stuckGameTimerRef.current) clearInterval(stuckGameTimerRef.current)
    }
  }, [])

  return {
    gameState,
    isLoading,
    error,
    joinGame: joinGameAction,
    makeMove: makeMoveAction,
    handleTimeout: handleTimeoutAction,
    cancelAutoTimeout,
    withdrawWinnings,
    refresh,
    isSpectator: !gameState?.isUserInGame,
    needsAction: gameState?.isMyTurn && gameState?.status === 'active',
    gameEnded: gameState?.status === 'completed',
    userWon: gameState?.hasWon,
    canPlay: gameState?.isUserInGame && gameState?.status === 'active',
    userBalance: gameState?.userBalance || "0",
    pendingWinnings: gameState?.pendingWinnings || "0",
    canWithdraw: gameState?.canWithdraw || false,
    totalPrizePool: gameState?.prizePool || "0"
  }
}

// hooks/useMyGames.ts - EVENT-DRIVEN VERSION
export function useMyGames() {
  const { address, isConnected } = useAccount()
  const { getGameCounter, getGame, getPlayers, getPlayerBalance } = useZeroSumData()
  const { subscribe } = useContractEvents() // Listen to all events
  
  const [myGames, setMyGames] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalGames: 0,
    activeGames: 0,
    waitingGames: 0,
    completedGames: 0,
    gamesAsCreator: 0,
    gamesAsPlayer: 0,
    totalWinnings: "0"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const mountedRef = useRef(true)
  const lastAddressRef = useRef<string | undefined>(address)

  // Clear state when address changes
  useEffect(() => {
    if (lastAddressRef.current !== address) {
      console.log(`🔄 MyGames: Account changed`)
      lastAddressRef.current = address
      setMyGames([])
      setStats({
        totalGames: 0,
        activeGames: 0,
        waitingGames: 0,
        completedGames: 0,
        gamesAsCreator: 0,
        gamesAsPlayer: 0,
        totalWinnings: "0"
      })
      setIsLoading(true)
      setError(null)
    }
  }, [address])

  // Fetch all user games (ONLY CALLED ON EVENTS OR INITIAL LOAD)
  const fetchMyGames = useCallback(async () => {
    if (!address || !isConnected) {
      setIsLoading(false)
      return
    }

    try {
      console.log(`🎮 MyGames: Fetching for ${address}`)
      
      const gameCounter = await getGameCounter()
      if (gameCounter === 0) {
        setMyGames([])
        setIsLoading(false)
        return
      }

      const userGames = []
      const promises = []
      
      for (let i = 0; i < gameCounter; i++) {
        promises.push(
          Promise.all([getGame(i), getPlayers(i)])
            .then(([game, players]) => ({ gameId: i, game, players }))
            .catch(error => {
              console.warn(`Failed to fetch game ${i}:`, error)
              return null
            })
        )
      }

      const results = await Promise.all(promises)
      
      for (const result of results) {
        if (result && mountedRef.current) {
          const { gameId, game, players } = result
          const isUserInGame = players.some((p: string) => p.toLowerCase() === address.toLowerCase())
          
          if (isUserInGame) {
            const isCreator = players[0]?.toLowerCase() === address.toLowerCase()
            const isOpponent = players[1]?.toLowerCase() === address.toLowerCase()
            const userBalance = await getPlayerBalance(address)
            
            const gameData = {
              gameId,
              mode: game.mode === 0 ? "Quick Draw" : "Strategic",
              status: game.status === 0 ? "waiting" : game.status === 1 ? "active" : "completed",
              currentNumber: Number(game.currentNumber),
              currentPlayer: game.currentPlayer,
              entryFee: ethers.formatEther(game.entryFee),
              prizePool: ethers.formatEther(game.prizePool),
              winner: game.winner && game.winner !== ethers.ZeroAddress ? game.winner : null,
              players,
              isCreator,
              isOpponent,
              myTurn: game.currentPlayer.toLowerCase() === address.toLowerCase(),
              timeLeft: 0,
              userBalance
            }
            
            userGames.push(gameData)
          }
        }
      }

      if (!mountedRef.current) return

      // Calculate stats
      const activeGames = userGames.filter(g => g.status === "active").length
      const waitingGames = userGames.filter(g => g.status === "waiting").length
      const completedGames = userGames.filter(g => g.status === "completed").length
      const gamesAsCreator = userGames.filter(g => g.isCreator).length
      const gamesAsPlayer = userGames.filter(g => g.isOpponent).length
      
      // Sort by priority
      userGames.sort((a, b) => {
        if (a.myTurn && a.status === "active" && (!b.myTurn || b.status !== "active")) return -1
        if (b.myTurn && b.status === "active" && (!a.myTurn || a.status !== "active")) return 1
        const statusOrder = { "active": 0, "waiting": 1, "completed": 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      setMyGames(userGames)
      setStats({
        totalGames: userGames.length,
        activeGames,
        waitingGames,
        completedGames,
        gamesAsCreator,
        gamesAsPlayer,
        totalWinnings: "0"
      })
      
      console.log(`✅ MyGames: Found ${userGames.length} games`)

    } catch (error) {
      console.error('❌ MyGames fetch error:', error)
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to load games')
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [address, isConnected, getGameCounter, getGame, getPlayers, getPlayerBalance])

  // Listen to all contract events
  useEffect(() => {
    if (!address || !isConnected) return

    console.log(`🎧 MyGames: Setting up event listeners`)

    const unsubscribe = subscribe((event) => {
      console.log(`📡 MyGames: Received event: ${event.type}`)
      
      // Check if this event affects the user
      const { gameId } = event
      const currentGame = myGames.find(g => g.gameId === gameId)
      
      if (event.type === 'GameCreated') {
        // Check if user created this game
        if (event.data.creator.toLowerCase() === address.toLowerCase()) {
          toast.success('Your game was created!')
          fetchMyGames()
        }
      } else if (event.type === 'PlayerJoined') {
        // Check if user joined or if someone joined user's game
        if (event.data.player.toLowerCase() === address.toLowerCase() || currentGame) {
          toast.success('Player joined!')
          fetchMyGames()
        }
      } else if (currentGame) {
        // User is involved in this game
        if (event.type === 'MoveMade') {
          toast.success('Move made in your game!')
          // Update the specific game
          setMyGames(prev => prev.map(game => 
            game.gameId === gameId 
              ? { ...game, currentNumber: Number(event.data.newNumber) }
              : game
          ))
          // Fetch full update after delay
          setTimeout(fetchMyGames, 1000)
        } else if (event.type === 'GameFinished') {
          toast.success('Your game finished!')
          fetchMyGames()
        }
      }
    })

    return unsubscribe
  }, [address, isConnected, subscribe, myGames, fetchMyGames])

  // Initial load
  useEffect(() => {
    if (isConnected && address) {
      fetchMyGames()
    } else {
      setIsLoading(false)
    }
  }, [isConnected, address, fetchMyGames])

  // Cleanup
  useEffect(() => {
    return () => {