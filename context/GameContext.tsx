// context/GameContext.tsx - OPTIMIZED for better battle page flow
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { useZeroSumData, GameMode, GameStatus } from '@/hooks/useZeroSumContract'


// Interfaces remain the same but with better TypeScript
export interface GameData {
  gameId: number
  status: GameStatus
  mode: GameMode
  currentNumber: number
  currentPlayer: string
  winner: string
  numberGenerated: boolean
  entryFee: string
  prizePool: string
}

export interface MyGame {
  gameId: number
  status: "waiting" | "active" | "completed"
  mode: "Quick Draw" | "Strategic"
  entryFee: string
  prizePool: string
  isCreator: boolean
  isPlayer: boolean
  currentPlayer: string
  myTurn: boolean
  timeLeft: number
  players: string[]
  winner?: string
  currentNumber?: number
  numberGenerated: boolean
  gameData: GameData
  lastUpdated: number // Add timestamp for cache management
}

export interface GameStats {
  totalGames: number
  activeGames: number
  waitingGames: number
  completedGames: number
  gamesAsCreator: number
  gamesAsPlayer: number
  totalWinnings: string
}

interface GameContextType {
  // Game data
  myGames: MyGame[]
  gameStats: GameStats
  currentGame: MyGame | null
  
  // Loading states
  isLoading: boolean
  error: string | null
  lastFetchTime: number
  
  // Actions
  fetchMyGames: (forceRefresh?: boolean) => Promise<void>
  refreshGame: (gameId: number) => Promise<void>
  setCurrentGame: (game: MyGame | null) => void
  clearGames: () => void
  preloadGame: (gameId: number) => Promise<MyGame | null>
  
  // Helper functions
  getGameById: (gameId: number) => MyGame | undefined
  getGamesByStatus: (status: "waiting" | "active" | "completed") => MyGame[]
  getMyTurnGames: () => MyGame[]
  hasUrgentActions: () => boolean
  isGameCached: (gameId: number) => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

// Enhanced cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly maxSize = 100

  set<T>(key: string, data: T, ttl: number = 60000): void { // Default 1 minute TTL
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const sorted = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = sorted.slice(0, Math.floor(this.maxSize / 2))
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }
}

const gameCache = new SmartCache()

export function GameProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { 
    getGameCounter, 
    getGame, 
    getPlayers, 
    getPlayerView,
    contractsReady,
    providerReady
  } = useZeroSumData()
  
  const [myGames, setMyGames] = useState<MyGame[]>([])
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    activeGames: 0,
    waitingGames: 0,
    completedGames: 0,
    gamesAsCreator: 0,
    gamesAsPlayer: 0,
    totalWinnings: "0"
  })
  const [currentGame, setCurrentGame] = useState<MyGame | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  
  // Refs for state management
  const isFetchingRef = useRef(false)
  const mountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to convert game mode
  const getGameModeString = (mode: GameMode): "Quick Draw" | "Strategic" => {
    return mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic"
  }

  // Helper function to convert game status
  const getGameStatusString = (status: GameStatus): "waiting" | "active" | "completed" => {
    switch (status) {
      case GameStatus.WAITING: return "waiting"
      case GameStatus.ACTIVE: return "active"
      case GameStatus.FINISHED: return "completed"
      default: return "waiting"
    }
  }

  // Check if user is involved in game
  const isUserInvolvedInGame = (players: string[], userAddress: string): { isPlayer: boolean; isCreator: boolean } => {
    if (!userAddress || !players || players.length === 0) {
      return { isPlayer: false, isCreator: false }
    }

    const normalizedAddress = userAddress.toLowerCase()
    const normalizedPlayers = players.map(p => p?.toLowerCase()).filter(Boolean)
    
    const isPlayer = normalizedPlayers.includes(normalizedAddress)
    const isCreator = normalizedPlayers.length > 0 && normalizedPlayers[0] === normalizedAddress
    
    return { isPlayer, isCreator }
  }

  // Enhanced single game processor
  const processGameData = async (gameId: number, userAddress: string): Promise<MyGame | null> => {
    const cacheKey = `processed-game-${gameId}-${userAddress}`
    
    // Check cache first
    const cached = gameCache.get<MyGame>(cacheKey)
    if (cached) {
      console.log(`💾 [GameContext] Cache hit for game ${gameId}`)
      return cached
    }
    
    try {
      console.log(`🔍 [GameContext] Processing game ${gameId}`)
      
      // Get game data and players sequentially to avoid RPC rate limits
      const gameData = await getGame(gameId)
      
      // Add small delay to respect RPC rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const players = await getPlayers(gameId)

      if (!mountedRef.current) return null

      if (!gameData || !players || players.length === 0) {
        console.log(`❌ [GameContext] Game ${gameId}: No data or players`)
        gameCache.set(cacheKey, null, 30000) // Cache negative result for 30 seconds
        return null
      }

      const { isPlayer, isCreator } = isUserInvolvedInGame(players, userAddress)
      
      if (!isPlayer) {
        console.log(`⏭️ [GameContext] Game ${gameId}: User not involved`)
        gameCache.set(cacheKey, null, 30000)
        return null
      }

      console.log(`✅ [GameContext] Game ${gameId}: User is ${isCreator ? 'creator' : 'player'}`)

      // Get player view for active games
      let playerView = null
      let myTurn = false
      let timeLeft = 0

      if (gameData.status === GameStatus.ACTIVE) {
        try {
          playerView = await getPlayerView(gameId)
          if (playerView && mountedRef.current) {
            myTurn = playerView.yourTurn
            timeLeft = playerView.timeLeft
            console.log(`🎯 [GameContext] Game ${gameId}: MyTurn=${myTurn}, TimeLeft=${timeLeft}`)
          }
        } catch (error) {
          console.warn(`[GameContext] Could not get player view for game ${gameId}:`, error)
        }
      }

      const processedGame: MyGame = {
        gameId,
        status: getGameStatusString(gameData.status),
        mode: getGameModeString(gameData.mode),
        entryFee: gameData.entryFee,
        prizePool: gameData.prizePool,
        isCreator,
        isPlayer,
        currentPlayer: gameData.currentPlayer || '0x0000000000000000000000000000000000000000',
        myTurn,
        timeLeft,
        players,
        winner: gameData.winner && gameData.winner !== '0x0000000000000000000000000000000000000000' ? gameData.winner : undefined,
        currentNumber: gameData.numberGenerated ? Number(gameData.currentNumber) : undefined,
        numberGenerated: gameData.numberGenerated,
        gameData,
        lastUpdated: Date.now()
      }

      // Cache with appropriate TTL
      const ttl = gameData.status === GameStatus.ACTIVE ? 30000 : 300000 // 30s for active, 5min for others
      gameCache.set(cacheKey, processedGame, ttl)
      
      return processedGame

    } catch (error) {
      console.error(`❌ [GameContext] Error processing game ${gameId}:`, error)
      gameCache.set(cacheKey, null, 10000) // Cache error for 10 seconds
      return null
    }
  }

  // Calculate stats from games
  const calculateStats = (games: MyGame[]): GameStats => {
    const activeGames = games.filter(g => g.status === "active").length
    const waitingGames = games.filter(g => g.status === "waiting").length
    const completedGames = games.filter(g => g.status === "completed").length
    const gamesAsCreator = games.filter(g => g.isCreator).length
    const gamesAsPlayer = games.filter(g => g.isPlayer && !g.isCreator).length
    
    const totalWinnings = games
      .filter(g => g.status === "completed" && g.winner?.toLowerCase() === address?.toLowerCase())
      .reduce((total, game) => total + parseFloat(game.prizePool), 0)
      .toFixed(4)

    return {
      totalGames: games.length,
      activeGames,
      waitingGames,
      completedGames,
      gamesAsCreator,
      gamesAsPlayer,
      totalWinnings
    }
  }

  // Enhanced batch processing with better error handling
  const batchProcessGames = async (gameIds: number[], userAddress: string): Promise<MyGame[]> => {
    if (!mountedRef.current) return []
    
    console.log(`🎯 [GameContext] Batch processing ${gameIds.length} games`)
    
    const results: MyGame[] = []
    const batchSize = 3
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      if (!mountedRef.current) break
      
      const batch = gameIds.slice(i, i + batchSize)
      
      const batchResults = await Promise.allSettled(
        batch.map(async (gameId, index) => {
          // Stagger requests to avoid overwhelming the RPC
          await new Promise(resolve => setTimeout(resolve, index * 100))
          return processGameData(gameId, userAddress)
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
        }
      }
      
      // Pause between batches to avoid rate limiting
      if (i + batchSize < gameIds.length && mountedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results.filter(Boolean)
  }

  // Main fetch function with improved logic
  const fetchMyGames = useCallback(async (forceRefresh = false) => {
    if (!address || !isConnected || !contractsReady || !providerReady) {
      console.log('❌ [GameContext] Prerequisites not met for fetchMyGames')
      setMyGames([])
      return
    }

    if (isFetchingRef.current && !forceRefresh) {
      console.log('🛑 [GameContext] Already fetching, skipping...')
      return
    }

    const now = Date.now()
    if (now - lastFetchTime < 10000 && !forceRefresh) {
      console.log('🛑 [GameContext] Throttled: Too soon since last fetch')
      return
    }

    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)

    console.log('\n🔍 [GameContext] === FETCHING USER GAMES ===')
    console.log('👤 User Address:', address)

    try {
      // Clear cache if force refresh
      if (forceRefresh) {
        gameCache.invalidate()
      }

      const gameCounter = await getGameCounter()
      console.log('📊 Total games on contract:', gameCounter)

      if (gameCounter === 0) {
        console.log('❌ No games found (gameCounter = 0)')
        setMyGames([])
        setGameStats(calculateStats([]))
        return
      }

      // Generate game IDs to check - focus on recent games
      const maxGamesToCheck = Math.min(gameCounter, 20) // Increased from 15
      const gameIdsToCheck: number[] = []
      
      // Check from newest to oldest
      for (let i = gameCounter - 1; i >= Math.max(0, gameCounter - maxGamesToCheck); i--) {
        gameIdsToCheck.push(i)
      }

      console.log(`🎯 Game counter: ${gameCounter}`)
      console.log(`🎯 Valid game ID range: 0 to ${gameCounter - 1}`)
      console.log(`🎯 Checking games: [${gameIdsToCheck.join(', ')}]`)

      const userGames = await batchProcessGames(gameIdsToCheck, address)

      if (!mountedRef.current) return

      // Sort by game ID (newest first)
      userGames.sort((a, b) => b.gameId - a.gameId)

      console.log(`\n🎯 === RESULTS ===`)
      console.log(`✅ User games found: ${userGames.length}`)
      console.log(`🎮 User games:`, userGames.map(g => `#${g.gameId} (${g.status})`))
      
      setMyGames(userGames)
      setGameStats(calculateStats(userGames))
      setLastFetchTime(now)

    } catch (error) {
      console.error('❌ [GameContext] Error fetching user games:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch games')
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      isFetchingRef.current = false
    }
  }, [address, isConnected, contractsReady, providerReady, getGameCounter, lastFetchTime])

  // Preload a specific game (useful for navigation)
  const preloadGame = useCallback(async (gameId: number): Promise<MyGame | null> => {
    if (!address || !isConnected || !contractsReady || !providerReady) {
      console.log(`❌ [GameContext] Cannot preload game ${gameId} - prerequisites not met`)
      return null
    }

    console.log(`🔄 [GameContext] Preloading game ${gameId}`)
    
    try {
      const game = await processGameData(gameId, address)
      
      if (game && mountedRef.current) {
        // Add to myGames if not already there
        setMyGames(prev => {
          const existing = prev.find(g => g.gameId === gameId)
          if (existing) {
            // Update existing
            return prev.map(g => g.gameId === gameId ? game : g)
          } else {
            // Add new, keep sorted
            return [game, ...prev].sort((a, b) => b.gameId - a.gameId)
          }
        })
        
        console.log(`✅ [GameContext] Preloaded game ${gameId}`)
        return game
      }
      
      return null
    } catch (error) {
      console.error(`❌ [GameContext] Failed to preload game ${gameId}:`, error)
      return null
    }
  }, [address, isConnected, contractsReady, providerReady])

  // Refresh specific game
  const refreshGame = useCallback(async (gameId: number) => {
    if (!address || !isConnected || !contractsReady || !providerReady) return
    
    console.log(`🔄 [GameContext] Refreshing game ${gameId}`)
    
    try {
      // Invalidate cache for this game
      gameCache.invalidate(`game-${gameId}`)
      
      const updatedGame = await processGameData(gameId, address)

      if (updatedGame && mountedRef.current) {
        // Update the game in the list
        setMyGames(prev => prev.map(g => g.gameId === gameId ? updatedGame : g))
        
        // Update current game if it's the same one
        if (currentGame?.gameId === gameId) {
          setCurrentGame(updatedGame)
        }
        
        // Recalculate stats
        setGameStats(prevStats => {
          const updatedGames = myGames.map(g => g.gameId === gameId ? updatedGame : g)
          return calculateStats(updatedGames)
        })
        
        console.log(`✅ [GameContext] Refreshed game ${gameId}`)
      }
      
    } catch (error) {
      console.error(`❌ [GameContext] Error refreshing game ${gameId}:`, error)
    }
  }, [address, isConnected, contractsReady, providerReady, currentGame, myGames])

  // Clear games and cache
  const clearGames = useCallback(() => {
    setMyGames([])
    setGameStats({
      totalGames: 0,
      activeGames: 0,
      waitingGames: 0,
      completedGames: 0,
      gamesAsCreator: 0,
      gamesAsPlayer: 0,
      totalWinnings: "0"
    })
    setCurrentGame(null)
    setLastFetchTime(0)
    gameCache.invalidate()
    console.log('🗑️ [GameContext] Games cleared and cache invalidated')
  }, [])

  // Helper functions
  const getGameById = useCallback((gameId: number) => {
    return myGames.find(game => game.gameId === gameId)
  }, [myGames])

  const getGamesByStatus = useCallback((status: "waiting" | "active" | "completed") => {
    return myGames.filter(game => game.status === status)
  }, [myGames])

  const getMyTurnGames = useCallback(() => {
    return myGames.filter(game => game.myTurn && game.status === "active")
  }, [myGames])

  const hasUrgentActions = useCallback(() => {
    const myTurnGames = getMyTurnGames()
    const urgentGames = myTurnGames.filter(game => game.timeLeft < 120) // 2 minutes warning
    return urgentGames.length > 0
  }, [getMyTurnGames])

  const isGameCached = useCallback((gameId: number) => {
    if (!address) return false
    const cacheKey = `processed-game-${gameId}-${address}`
    return gameCache.has(cacheKey)
  }, [address])

  // Auto-fetch on mount and when prerequisites change
  useEffect(() => {
    if (isConnected && address && contractsReady && providerReady) {
      console.log('🚀 [GameContext] Auto-fetching games on prerequisites ready')
      fetchMyGames()
    } else {
      clearGames()
    }
  }, [isConnected, address, contractsReady, providerReady, fetchMyGames, clearGames])

  // Intelligent polling setup
  useEffect(() => {
    if (!isConnected || !address || !contractsReady || !providerReady) return

    console.log('⏰ [GameContext] Setting up intelligent polling')
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      if (!error && !isFetchingRef.current && mountedRef.current) {
        const hasActiveGames = myGames.some(g => g.status === "active")
        const hasMyTurnGames = myGames.some(g => g.myTurn && g.status === "active")
        
        // More aggressive polling for urgent games, less for others
        let shouldFetch = false
        
        if (hasMyTurnGames) {
          // Poll every 60 seconds if it's user's turn (reduced from 30s)
          shouldFetch = Math.random() < 0.5
        } else if (hasActiveGames) {
          // Poll every 2 minutes for active games (reduced from 60s)
          shouldFetch = Math.random() < 0.2
        } else {
          // Poll every 5 minutes for waiting/completed games (reduced from 2min)
          shouldFetch = Math.random() < 0.05
        }
        
        if (shouldFetch) {
          console.log('⏰ [GameContext] Intelligent polling triggered')
          fetchMyGames()
        }
      }
    }, 60000) // Check every 60 seconds (reduced from 30s)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isConnected, address, contractsReady, providerReady, error, myGames, fetchMyGames])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('🎮 [GameContext] State updated:', {
      myGames: myGames.length,
      currentGame: currentGame?.gameId || 'none',
      isLoading,
      error,
      lastFetchTime: new Date(lastFetchTime).toLocaleTimeString(),
      address: address?.slice(0, 6) + '...' + address?.slice(-4),
      contractsReady,
      providerReady
    })
  }, [myGames, currentGame, isLoading, error, lastFetchTime, address, contractsReady, providerReady])

  const value: GameContextType = {
    myGames,
    gameStats,
    currentGame,
    isLoading,
    error,
    lastFetchTime,
    fetchMyGames,
    refreshGame,
    setCurrentGame,
    clearGames,
    preloadGame,
    getGameById,
    getGamesByStatus,
    getMyTurnGames,
    hasUrgentActions,
    isGameCached,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameContext() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  return context
}