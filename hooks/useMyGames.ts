// hooks/useMyGames.ts (Fixed Version)
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useZeroSumData, GameMode, GameStatus } from './useZeroSumContract'


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
  gameData: any
}

export interface MyGamesStats {
  totalGames: number
  activeGames: number
  waitingGames: number
  completedGames: number
  gamesAsCreator: number
  gamesAsPlayer: number
  totalWinnings: string
}

// Local cache for game data to prevent redundant requests
const gameCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 15000 // 15 seconds cache

function getCachedData<T>(key: string): T | null {
  const cached = gameCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedData<T>(key: string, data: T): void {
  gameCache.set(key, { data, timestamp: Date.now() })
  
  // Cleanup old cache entries
  if (gameCache.size > 50) {
    const entries = Array.from(gameCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, 25)
    toDelete.forEach(([k]) => gameCache.delete(k))
  }
}

// Cache invalidation function
function invalidateCache(): void {
  gameCache.clear()
  console.log('🗑️ Game cache cleared')
}

export function useMyGames() {
  const { address, isConnected } = useAccount()
  const { 
    getGameCounter, 
    getGame, 
    getPlayers, 
    getPlayerView,
  } = useZeroSumData()
  
  const [myGames, setMyGames] = useState<MyGame[]>([])
  const [stats, setStats] = useState<MyGamesStats>({
    totalGames: 0,
    activeGames: 0,
    waitingGames: 0,
    completedGames: 0,
    gamesAsCreator: 0,
    gamesAsPlayer: 0,
    totalWinnings: "0"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  // Prevent multiple concurrent fetches
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

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

  // Enhanced user involvement check with better logging
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

  // Batch process multiple games efficiently
  const batchProcessGames = async (gameIds: number[], userAddress: string): Promise<MyGame[]> => {
    if (!mountedRef.current) return []
    
    console.log(`🎯 Batch processing ${gameIds.length} games`)
    
    const results: MyGame[] = []
    const batchSize = 3 // Reduced batch size to prevent RPC overload
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      if (!mountedRef.current) break
      
      const batch = gameIds.slice(i, i + batchSize)
      
      // Process batch in parallel with throttling
      const batchPromises = batch.map(async (gameId, index) => {
        // Add staggered delay to prevent RPC spam
        await new Promise(resolve => setTimeout(resolve, index * 200))
        
        if (!mountedRef.current) return null
        
        const cacheKey = `processed-game-${gameId}-${userAddress}`
        const cached = getCachedData<MyGame | null>(cacheKey)
        
        if (cached !== null) {
          console.log(`💾 Cache hit for game ${gameId}`)
          return cached
        }
        
        try {
          console.log(`🔍 Fetching game ${gameId}...`)
          
          const [gameData, players] = await Promise.all([
            getGame(gameId),
            getPlayers(gameId)
          ])

          if (!mountedRef.current) return null

          if (!gameData || !players || players.length === 0) {
            console.log(`❌ Game ${gameId}: No data or players`)
            setCachedData(cacheKey, null)
            return null
          }

          const { isPlayer, isCreator } = isUserInvolvedInGame(players, userAddress)
          
          if (!isPlayer) {
            console.log(`⏭️ Game ${gameId}: User not involved`)
            setCachedData(cacheKey, null)
            return null
          }

          console.log(`✅ Game ${gameId}: User is ${isCreator ? 'creator' : 'player'}`)

          // Get player view only for active games where user is involved
          let playerView = null
          let myTurn = false
          let timeLeft = 0

          if (gameData.status === GameStatus.ACTIVE) {
            try {
              playerView = await getPlayerView(gameId)
              if (playerView && mountedRef.current) {
                myTurn = playerView.yourTurn
                timeLeft = playerView.timeLeft
                console.log(`🎯 Game ${gameId}: MyTurn=${myTurn}, TimeLeft=${timeLeft}`)
              }
            } catch (error) {
              console.warn(`Could not get player view for game ${gameId}:`, error)
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
            currentPlayer: gameData.currentPlayer || ethers.ZeroAddress,
            myTurn,
            timeLeft,
            players,
            winner: gameData.winner && gameData.winner !== ethers.ZeroAddress ? gameData.winner : undefined,
            currentNumber: gameData.numberGenerated ? Number(gameData.currentNumber) : undefined,
            numberGenerated: gameData.numberGenerated,
            gameData
          }

          setCachedData(cacheKey, processedGame)
          return processedGame

        } catch (error) {
          console.error(`Error processing game ${gameId}:`, error)
          setCachedData(cacheKey, null)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      if (mountedRef.current) {
        results.push(...batchResults.filter(Boolean) as MyGame[])
      }
      
      // Delay between batches to prevent RPC overload
      if (i + batchSize < gameIds.length && mountedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  // Calculate stats from games
  const calculateStats = (games: MyGame[]): MyGamesStats => {
    const activeGames = games.filter(g => g.status === "active").length
    const waitingGames = games.filter(g => g.status === "waiting").length
    const completedGames = games.filter(g => g.status === "completed").length
    const gamesAsCreator = games.filter(g => g.isCreator).length
    const gamesAsPlayer = games.filter(g => g.isPlayer && !g.isCreator).length
    
    // Calculate total winnings
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

  // Optimized fetch function with smart game discovery
  const fetchMyGames = useCallback(async (forceRefresh = false) => {
    if (!address || !isConnected) {
      console.log('❌ No address or not connected')
      setMyGames([])
      setDebugInfo({ message: 'Not connected' })
      return
    }

    // Prevent concurrent fetches and implement throttling
    if (isFetchingRef.current && !forceRefresh) {
      console.log('🛑 Already fetching, skipping...')
      return
    }

    const now = Date.now()
    if (now - lastFetchTimeRef.current < 10000 && !forceRefresh) {
      console.log('🛑 Throttled: Too soon since last fetch')
      return
    }

    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)
    lastFetchTimeRef.current = now

    console.log('\n🔍 === OPTIMIZED FETCH USER GAMES ===')
    console.log('👤 User Address:', address)

    const debug = {
      userAddress: address,
      gameCounter: 0,
      gamesChecked: [],
      userGames: [],
      errors: [],
      cacheMisses: 0,
      cacheHits: 0,
      timestamp: new Date().toISOString()
    }

    try {
      // Get game counter with caching
      const gameCounter = await getGameCounter()
      debug.gameCounter = gameCounter
      
      console.log('📊 Total games on contract:', gameCounter)

      if (gameCounter === 0) {
        console.log('❌ No games found (gameCounter = 0)')
        setMyGames([])
        setDebugInfo(debug)
        return
      }

      // Smart game discovery: Start from recent games and work backwards
      const maxGamesToCheck = Math.min(gameCounter, 15) // Reduced to 15 games for better performance
      const gameIdsToCheck: number[] = []
      
      // Check recent games first (most likely to be user games)
      for (let i = gameCounter - 1; i >= Math.max(0, gameCounter - maxGamesToCheck); i--) {
        gameIdsToCheck.push(i)
      }

      console.log(`🎯 Checking ${gameIdsToCheck.length} recent games`)

      // Batch process games
      const userGames = await batchProcessGames(gameIdsToCheck, address)

      if (!mountedRef.current) return

      // Sort games by ID (newest first)
      userGames.sort((a, b) => b.gameId - a.gameId)

      console.log(`\n🎯 === OPTIMIZED RESULTS ===`)
      console.log(`📊 Games checked: ${gameIdsToCheck.length}`)
      console.log(`✅ User games found: ${userGames.length}`)
      console.log(`🎮 User games:`, userGames.map(g => `#${g.gameId} (${g.status})`))
      
      debug.userGames = userGames.map(g => g.gameId)
      debug.gamesChecked = gameIdsToCheck.map(id => ({ gameId: id, processed: true }))
      
      setMyGames(userGames)
      setStats(calculateStats(userGames))
      setDebugInfo(debug)

    } catch (error) {
      console.error('❌ Error fetching user games:', error)
      debug.errors.push({ 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      setError(error instanceof Error ? error.message : 'Failed to fetch games')
      setDebugInfo(debug)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
      isFetchingRef.current = false
    }
  }, [address, isConnected, getGameCounter, getGame, getPlayers, getPlayerView])

  // Auto-fetch on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('🚀 Auto-fetching games on mount/address change')
      fetchMyGames()
    } else {
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
    }
  }, [isConnected, address])

  // Set up polling with longer intervals
  useEffect(() => {
    if (!isConnected || !address) return

    console.log('⏰ Setting up polling for my games')
    
    // Poll every 60 seconds for active games, less frequent for others
    intervalRef.current = setInterval(() => {
      if (!error && !isFetchingRef.current && mountedRef.current) {
        // More frequent updates if user has active games
        const hasActiveGames = myGames.some(g => g.status === "active")
        const shouldFetch = hasActiveGames || Math.random() < 0.2 // 20% chance for non-active (reduced from 30%)
        
        if (shouldFetch) {
          console.log('⏰ Polling update triggered')
          fetchMyGames()
        }
      }
    }, 60000) // Increased from 30s to 60s

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isConnected, address, error, myGames])

  // Manual refresh function with cache invalidation
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered - clearing all caches')
    // Clear local cache
    invalidateCache()
    // Reset throttle
    lastFetchTimeRef.current = 0
    // Force refresh
    fetchMyGames(true)
  }, [fetchMyGames])

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

  // Get games by status
  const getGamesByStatus = useCallback((status: "waiting" | "active" | "completed") => {
    return myGames.filter(game => game.status === status)
  }, [myGames])

  // Get games where it's user's turn
  const getMyTurnGames = useCallback(() => {
    return myGames.filter(game => game.myTurn && game.status === "active")
  }, [myGames])

  // Get games user created
  const getCreatedGames = useCallback(() => {
    return myGames.filter(game => game.isCreator)
  }, [myGames])

  // Check if user has any urgent actions needed
  const hasUrgentActions = useCallback(() => {
    const myTurnGames = getMyTurnGames()
    const urgentGames = myTurnGames.filter(game => game.timeLeft < 60) // Less than 1 minute
    return urgentGames.length > 0
  }, [getMyTurnGames])

  // Get games where user needs to act soon
  const getUrgentGames = useCallback(() => {
    return getMyTurnGames().filter(game => game.timeLeft < 60)
  }, [getMyTurnGames])

  return {
    myGames,
    stats,
    isLoading,
    error,
    debugInfo,
    refresh,
    fetchMyGames,
    getGamesByStatus,
    getMyTurnGames,
    getCreatedGames,
    hasUrgentActions,
    getUrgentGames,
    // Helper data
    activeGames: getGamesByStatus("active"),
    waitingGames: getGamesByStatus("waiting"),
    completedGames: getGamesByStatus("completed"),
    myTurnGames: getMyTurnGames(),
    createdGames: getCreatedGames(),
    urgentGames: getUrgentGames()
  }
}