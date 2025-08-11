// hooks/useBrowseGames.ts (EMERGENCY FIX - STOPS INFINITE CALLS)
import { useState, useEffect, useRef } from 'react'
import { useZeroSumData, GameMode, GameStatus } from './useZeroSumContract'

export interface BattleData {
  id: number
  mode: string
  modeId: string
  creator: string
  creatorAddress: string // Add creator's wallet address for security checks
  entryFee: string
  prizePool: string
  timeLeft: string
  spectators: number
  difficulty: string
  iconType: string
  gradient: string
  bgGradient: string
  isHot: boolean
  status: string
  gameData?: any
}

export interface BattleFilter {
  id: string
  label: string
  count: number
}

export function useBrowseGames() {
  const { getGameCounter, getGame, getPlayers } = useZeroSumData()
  const [battles, setBattles] = useState<BattleData[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [filters, setFilters] = useState<BattleFilter[]>([
    { id: "all", label: "ALL BATTLES", count: 0 },
    { id: "quick-draw", label: "QUICK DRAW", count: 0 },
    { id: "strategic", label: "STRATEGIC", count: 0 },
  ])

  // Prevent infinite re-renders
  const isLoadingRef = useRef(false)
  const stableDataCache = useRef<Map<number, { timeLeft: string; spectators: number }>>(new Map())

  // Helper functions
  const getModeInfo = (mode: GameMode) => {
    switch (mode) {
      case GameMode.QUICK_DRAW:
        return {
          name: "Quick Draw",
          modeId: "quick-draw",
          difficulty: "★★☆☆☆",
          iconType: "target",
          gradient: "from-emerald-400 via-teal-500 to-cyan-600",
          bgGradient: "from-emerald-900/20 to-teal-900/20"
        }
      case GameMode.STRATEGIC:
        return {
          name: "Strategic",
          modeId: "strategic", 
          difficulty: "★★★★☆",
          iconType: "brain",
          gradient: "from-blue-400 via-indigo-500 to-purple-600",
          bgGradient: "from-blue-900/20 to-indigo-900/20"
        }
      default:
        return {
          name: "Unknown",
          modeId: "unknown",
          difficulty: "★☆☆☆☆",
          iconType: "eye",
          gradient: "from-gray-400 to-gray-600",
          bgGradient: "from-gray-900/20 to-gray-900/20"
        }
    }
  }

  const truncateAddress = (address: string) => {
    if (!address) return "Unknown"
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getStableData = (gameId: number) => {
    if (!stableDataCache.current.has(gameId)) {
      const minutes = Math.floor(Math.random() * 15) + 1
      const seconds = Math.floor(Math.random() * 60)
      const timeLeft = `${minutes}m ${seconds}s`
      const spectators = Math.floor(Math.random() * 50) + 1
      
      stableDataCache.current.set(gameId, { timeLeft, spectators })
    }
    
    return stableDataCache.current.get(gameId)!
  }

  const isHotBattle = (prizePool: string, spectators: number) => {
    const poolValue = parseFloat(prizePool)
    return poolValue > 0.05 || spectators > 20
  }

  // SIMPLE fetch function - NO useCallback to prevent dependency loops
  const fetchBattles = async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current) {
      console.log('🛑 Already loading, skipping...')
      return
    }

    isLoadingRef.current = true
    setLoading(true)
    console.log('🔍 Fetching battles (safe mode)...')
    
    try {
      const gameCounter = await getGameCounter()
      console.log('📊 Game counter:', gameCounter)
      
      if (gameCounter === 0) {
        console.log('❌ No games found')
        setBattles([])
        setDebugInfo({ gameCounter: 0, message: 'No games created yet' })
        setLoading(false)
        isLoadingRef.current = false
        return
      }

      const debugData = {
        gameCounter,
        gamesChecked: [],
        gamesFiltered: [],
        errors: []
      }
      
      const activeBattles: BattleData[] = []
      let quickDrawCount = 0
      let strategicCount = 0
      
      // Check games one by one to avoid overwhelming RPC
      for (let i = 0; i < gameCounter; i++) {
        try {
          // Add small delay to prevent RPC overload
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          const [game, players] = await Promise.all([
            getGame(i),
            getPlayers(i)
          ])

          console.log(`Game ${i}:`, {
            exists: !!game,
            status: game?.status,
            players: players?.length
          })

          // Simple validation - no complex logic
          const isValid = game && 
                          game.status === GameStatus.WAITING && 
                          players && 
                          players.length < 2 && 
                          game.entryFee && 
                          game.entryFee !== "0"

          debugData.gamesChecked.push({
            id: i,
            hasGame: !!game,
            status: game?.status,
            playersCount: players?.length,
            bettable: isValid,
            reason: isValid ? "PASSED - Should be included" : "Failed validation"
          })

          if (isValid) {
            const modeInfo = getModeInfo(game.mode)
            const stableData = getStableData(i)
            const creator = players.length > 0 ? truncateAddress(players[0]) : "Unknown"
            
            const battleData: BattleData = {
              id: i,
              mode: modeInfo.name,
              modeId: modeInfo.modeId,
              creator,
              creatorAddress: players.length > 0 ? players[0] : "", // Add creator's actual address
              entryFee: game.entryFee,
              prizePool: game.prizePool,
              timeLeft: stableData.timeLeft,
              spectators: stableData.spectators,
              difficulty: modeInfo.difficulty,
              iconType: modeInfo.iconType,
              gradient: modeInfo.gradient,
              bgGradient: modeInfo.bgGradient,
              isHot: isHotBattle(game.prizePool, stableData.spectators),
              status: "WAITING",
              gameData: game
            }

            activeBattles.push(battleData)
            debugData.gamesFiltered.push(i)
            
            if (game.mode === GameMode.QUICK_DRAW) {
              quickDrawCount++
            } else if (game.mode === GameMode.STRATEGIC) {
              strategicCount++
            }
          }

        } catch (error) {
          console.error(`Error processing game ${i}:`, error)
          debugData.errors.push({ gameId: i, error: error.message })
        }
      }

      console.log('✅ Results:', {
        totalGames: gameCounter,
        activeBattles: activeBattles.length
      })

      setBattles(activeBattles)
      setDebugInfo(debugData)
      
      setFilters([
        { id: "all", label: "ALL BATTLES", count: activeBattles.length },
        { id: "quick-draw", label: "QUICK DRAW", count: quickDrawCount },
        { id: "strategic", label: "STRATEGIC", count: strategicCount },
      ])
      
    } catch (error) {
      console.error('❌ Error fetching battles:', error)
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  // Manual refetch function
  const refetch = () => {
    console.log('🔄 Manual refresh requested')
    fetchBattles()
  }

  // SIMPLE useEffect - NO dependencies that could cause loops
  useEffect(() => {
    console.log('🚀 Initial load')
    fetchBattles()
    
    // NO AUTO-REFRESH FOR NOW - only manual refresh
    // This prevents the infinite loop issue
    
  }, []) // Empty dependency array

  return {
    battles,
    loading,
    filters,
    debugInfo,
    refetch
  }
}