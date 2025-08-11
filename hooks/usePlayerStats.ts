
// hooks/usePlayerStats.ts
import { useState, useEffect } from 'react'
import { useZeroSumData } from './useZeroSumContract'

export interface PlayerStatsData {
  wins: number
  losses: number
  rank: number
  totalEarnings: string
  winRate: number
  isLoading: boolean
  balance: string
  stakedAmount: string
  totalPlayed: number
}

export function usePlayerStats(address: string | undefined) {
  const { getPlayerStats, getPlayerBalance, getStakingInfo } = useZeroSumData()
  const [stats, setStats] = useState<PlayerStatsData>({
    wins: 0,
    losses: 0,
    rank: 0,
    totalEarnings: "0",
    winRate: 0,
    isLoading: true,
    balance: "0",
    stakedAmount: "0",
    totalPlayed: 0
  })

  const fetchStats = async () => {
    if (!address) {
      setStats(prev => ({ ...prev, isLoading: false }))
      return
    }

    setStats(prev => ({ ...prev, isLoading: true }))

    try {
      console.log('📊 Fetching player stats for:', address)
      
      // Fetch all player data in parallel
      const [playerStats, balance, stakingInfo] = await Promise.all([
        getPlayerStats(address),
        getPlayerBalance(address),
        getStakingInfo(address)
      ])

      console.log('Player stats result:', {
        playerStats,
        balance,
        stakingInfo
      })

      if (playerStats) {
        const losses = Math.max(0, playerStats.played - playerStats.wins)
        
        setStats({
          wins: playerStats.wins,
          losses,
          totalPlayed: playerStats.played,
          rank: 47, // TODO: Implement ranking logic
          totalEarnings: playerStats.balance,
          winRate: playerStats.winRate,
          isLoading: false,
          balance: balance || "0",
          stakedAmount: stakingInfo?.amount || "0"
        })
      } else {
        setStats(prev => ({ 
          ...prev, 
          isLoading: false,
          balance: balance || "0",
          stakedAmount: stakingInfo?.amount || "0"
        }))
      }
    } catch (error) {
      console.error('Error fetching player stats:', error)
      setStats(prev => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [address])

  return {
    ...stats,
    refetch: fetchStats
  }
}

// Hook for real-time game data
export function useGameData(gameId: number | undefined) {
  const { getGame, getPlayers, getPlayerView } = useZeroSumData()
  const [gameData, setGameData] = useState({
    game: null,
    players: [],
    playerView: null,
    loading: true,
    error: null
  })

  const fetchGameData = async () => {
    if (gameId === undefined) {
      setGameData(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      console.log(`🎮 Fetching game data for game ${gameId}`)
      
      const [game, players, playerView] = await Promise.all([
        getGame(gameId),
        getPlayers(gameId),
        getPlayerView(gameId)
      ])

      console.log(`Game ${gameId} data:`, {
        game,
        players,
        playerView
      })

      setGameData({
        game,
        players,
        playerView,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching game data:', error)
      setGameData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }))
    }
  }

  useEffect(() => {
    fetchGameData()
    
    // Refresh every 5 seconds for active games
    const interval = setInterval(fetchGameData, 5000)
    return () => clearInterval(interval)
  }, [gameId])

  return {
    ...gameData,
    refetch: fetchGameData
  }
}

// Hook for platform statistics
export function usePlatformStats() {
  const { getPlatformStats } = useZeroSumData()
  const [stats, setStats] = useState({
    gameCounter: 0,
    platformFee: 5,
    totalStaked: "0",
    timeLimit: 300,
    stakingAPY: 1000,
    loading: true
  })

  const fetchStats = async () => {
    try {
      const platformStats = await getPlatformStats()
      
      if (platformStats) {
        setStats({
          ...platformStats,
          loading: false
        })
      } else {
        setStats(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return {
    ...stats,
    refetch: fetchStats
  }
}
