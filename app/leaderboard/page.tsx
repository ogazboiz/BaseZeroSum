"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Trophy, 
  Crown, 
  Target, 
  Brain, 
  TrendingUp,
  Users,
  Medal,
  Star,
  Gamepad2,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  Award,
  Zap
} from "lucide-react"
import { 
  useZeroSumData, 
  GameData, 
  GameStatus, 
  GameMode 
} from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

interface PlayerStats {
  address: string
  totalGames: number
  gamesWon: number
  gamesLost: number
  gamesCreated: number
  gamesJoined: number
  totalWinnings: string
  winRate: number
  quickDrawGames: number
  strategicGames: number
  averagePrizePool: string
  lastActive: Date
  recentGames: number[]
}

interface LeaderboardCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  sortKey: keyof PlayerStats
  sortDesc: boolean
}

export default function FixedLeaderboardPage() {
  const {
    getGameCounter,
    getGamesBatch,
    getPlayers,
    getUserGames,
    contractsReady,
    providerReady
  } = useZeroSumData()

  const [leaderboardData, setLeaderboardData] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("win-rate")
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const leaderboardCategories: LeaderboardCategory[] = [
    {
      id: "win-rate",
      name: "Win Rate",
      description: "Highest win percentage",
      icon: <Trophy className="w-5 h-5" />,
      sortKey: "winRate",
      sortDesc: true
    },
    {
      id: "total-winnings",
      name: "Total Winnings",
      description: "Most ETH earned",
      icon: <Crown className="w-5 h-5" />,
      sortKey: "totalWinnings",
      sortDesc: true
    },
    {
      id: "games-played",
      name: "Games Played",
      description: "Most active players",
      icon: <Gamepad2 className="w-5 h-5" />,
      sortKey: "totalGames",
      sortDesc: true
    },
    {
      id: "games-created",
      name: "Games Created",
      description: "Top game creators",
      icon: <Star className="w-5 h-5" />,
      sortKey: "gamesCreated",
      sortDesc: true
    },
    {
      id: "recent-activity",
      name: "Recent Activity",
      description: "Most recently active",
      icon: <Zap className="w-5 h-5" />,
      sortKey: "lastActive",
      sortDesc: true
    }
  ]

  // ✅ OPTIMIZED: Fetch leaderboard data efficiently using new functions
  const fetchLeaderboardData = useCallback(async () => {
    if (!contractsReady) return

    console.log('🏆 Fetching leaderboard data (OPTIMIZED)...')
    setIsLoading(true)
    setError(null)

    try {
      // Get total game counter
      const gameCounter = await getGameCounter()
      console.log(`📊 Total games on contract: ${gameCounter}`)

      if (gameCounter <= 1) {
        setLeaderboardData([])
        setLastUpdated(new Date().toLocaleTimeString())
        return
      }

      // ✅ STEP 1: Get all games in batch
      const gameIds = Array.from({ length: gameCounter - 1 }, (_, i) => i + 1)
      console.log(`🚀 Batch fetching ${gameIds.length} games for leaderboard...`)

      const allGames = await getGamesBatch(gameIds)
      const validGames = allGames.filter(game => game !== null)

      console.log(`✅ Fetched ${validGames.length} valid games`)

      // ✅ STEP 2: Get unique players from all games efficiently
      const playerAddresses = new Set<string>()
      const gamePlayerMap = new Map<number, string[]>()

      // Get players for all games in parallel
      const playerPromises = validGames.map(async (game) => {
        if (!game) return null
        
        try {
          const players = await getPlayers(game.gameId)
          gamePlayerMap.set(game.gameId, players)
          return { gameId: game.gameId, players }
        } catch (error) {
          console.warn(`Failed to get players for game ${game.gameId}:`, error)
          return null
        }
      })

      const playerResults = await Promise.all(playerPromises)
      
      // Collect all unique player addresses
      playerResults.forEach(result => {
        if (result) {
          result.players.forEach(addr => playerAddresses.add(addr))
        }
      })

      const uniquePlayers = Array.from(playerAddresses)
      console.log(`👥 Found ${uniquePlayers.length} unique players`)

      // ✅ STEP 3: Calculate stats for each player using optimized getUserGames
      const playerStatsPromises = uniquePlayers.map(async (address) => {
        try {
          console.log(`📊 Calculating stats for player: ${address.slice(0, 8)}...`)
          
          // ✅ OPTIMIZED: Use getUserGames to get all user's games at once
          const userGamesResult = await getUserGames(address, 0, 1000) // Get up to 1000 games
          const userGameIds = userGamesResult.gameIds
          const userGamesData = userGamesResult.games

          console.log(`📋 Player ${address.slice(0, 8)} has ${userGamesData.length} games`)

          // Initialize stats
          let gamesWon = 0
          let gamesLost = 0
          let gamesCreated = 0
          let gamesJoined = 0
          let totalWinnings = 0
          let quickDrawGames = 0
          let strategicGames = 0
          let lastActive = new Date(0)
          const recentGames: number[] = []

          // Process user's games
          for (let i = 0; i < userGamesData.length; i++) {
            const game = userGamesData[i]
            if (!game) continue

            const gameId = userGameIds[i]
            const players = gamePlayerMap.get(gameId) || []
            const isCreator = players.length > 0 && players[0].toLowerCase() === address.toLowerCase()
            const isWinner = game.winner && game.winner.toLowerCase() === address.toLowerCase()

            // Only count finished games for win/loss stats
            if (game.status === GameStatus.FINISHED) {
              if (isWinner) {
                gamesWon++
                totalWinnings += parseFloat(game.prizePool)
              } else {
                gamesLost++
              }
              
              // Update last active time (use block timestamp if available, otherwise current time)
              // Since we don't have timestamp in GameData, we'll use game creation order
              const gameTime = new Date()
              if (gameTime > lastActive) {
                lastActive = gameTime
              }
            }

            // Count creator vs joiner
            if (isCreator) {
              gamesCreated++
            } else {
              gamesJoined++
            }

            // Count by game mode
            if (game.mode === GameMode.QUICK_DRAW) {
              quickDrawGames++
            } else {
              strategicGames++
            }

            // Track recent games (last 10)
            if (recentGames.length < 10) {
              recentGames.push(gameId)
            }
          }

          const totalGames = gamesWon + gamesLost
          const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0
          const averagePrizePool = gamesWon > 0 ? (totalWinnings / gamesWon).toFixed(4) : "0"

          const playerStats: PlayerStats = {
            address,
            totalGames,
            gamesWon,
            gamesLost,
            gamesCreated,
            gamesJoined,
            totalWinnings: totalWinnings.toFixed(4),
            winRate,
            quickDrawGames,
            strategicGames,
            averagePrizePool,
            lastActive,
            recentGames
          }

          console.log(`✅ Stats for ${address.slice(0, 8)}:`, {
            totalGames,
            winRate,
            totalWinnings: totalWinnings.toFixed(4)
          })

          return playerStats
        } catch (error) {
          console.warn(`Failed to calculate stats for player ${address}:`, error)
          return null
        }
      })

      const allPlayerStats = (await Promise.all(playerStatsPromises))
        .filter((stats): stats is PlayerStats => stats !== null)
        .filter(stats => stats.totalGames > 0) // Only show players with completed games

      console.log(`✅ Successfully calculated stats for ${allPlayerStats.length} players`)

      setLeaderboardData(allPlayerStats)
      setLastUpdated(new Date().toLocaleTimeString())

    } catch (error) {
      console.error('❌ Error fetching leaderboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }, [contractsReady, getGameCounter, getGamesBatch, getPlayers, getUserGames])

  // Initial data fetch
  useEffect(() => {
    if (providerReady) {
      fetchLeaderboardData()
    }
  }, [providerReady, fetchLeaderboardData])

  // Get current category
  const currentCategory = leaderboardCategories.find(cat => cat.id === selectedCategory)

  // Sort and filter data
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (!currentCategory) return 0
    
    const aValue = a[currentCategory.sortKey]
    const bValue = b[currentCategory.sortKey]
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const aNum = parseFloat(aValue)
      const bNum = parseFloat(bValue)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return currentCategory.sortDesc ? bNum - aNum : aNum - bNum
      }
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return currentCategory.sortDesc ? bValue.getTime() - aValue.getTime() : aValue.getTime() - bValue.getTime()
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentCategory.sortDesc ? bValue - aValue : aValue - bValue
    }
    
    return 0
  })

  const filteredData = sortedData.filter(player =>
    player.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.winRate.toString().includes(searchTerm) ||
    player.totalGames.toString().includes(searchTerm)
  )

  // Get top 3 for special display
  const top3 = filteredData.slice(0, 3)
  const rest = filteredData.slice(3)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-300" />
      case 3: return <Award className="w-6 h-6 text-amber-600" />
      default: return <span className="text-2xl font-bold text-slate-400">{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30"
      case 2: return "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30"
      case 3: return "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30"
      default: return "bg-slate-800/60 border-slate-700/50"
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getDisplayValue = (player: PlayerStats, category: LeaderboardCategory) => {
    switch (category.id) {
      case "win-rate":
        return `${player.winRate}%`
      case "total-winnings":
        return `${player.totalWinnings} ETH`
      case "games-played":
        return player.totalGames.toString()
      case "games-created":
        return player.gamesCreated.toString()
      case "recent-activity":
        return player.lastActive.toLocaleDateString()
      default:
        return player.winRate.toString()
    }
  }

  if (!providerReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-xl font-bold text-white">Connecting to blockchain...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <UnifiedGamingNavigation />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full px-6 py-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">LEADERBOARD</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">PLAYER RANKINGS</h1>
          <p className="text-xl text-slate-300 font-medium">See who's dominating the battlefield</p>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: {lastUpdated || "Never"}
          </p>
        </div>

        {/* Category Selector */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap justify-center">
            {leaderboardCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`${
                  selectedCategory === category.id 
                    ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500' 
                    : 'border-slate-600 text-slate-300 hover:text-white'
                }`}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </Button>
            ))}
          </div>
          {currentCategory && (
            <p className="text-center text-slate-400 mt-2">
              {currentCategory.description}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by address, win rate, or games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white rounded-xl"
              />
            </div>
          </div>
          
          <Button
            onClick={fetchLeaderboardData}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">{isLoading ? "Updating..." : "Refresh"}</span>
          </Button>
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <p className="text-blue-400 font-medium">Updating leaderboard data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {top3.length > 0 && currentCategory && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🏆 TOP PERFORMERS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3.map((player, index) => (
                <Card key={player.address} className={`${getRankColor(index + 1)} transition-all hover:scale-105`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {getRankIcon(index + 1)}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {formatAddress(player.address)}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{currentCategory.name}:</span>
                        <span className="text-yellow-400 font-bold">{getDisplayValue(player, currentCategory)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Games:</span>
                        <span className="text-white">{player.totalGames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Win Rate:</span>
                        <span className="text-emerald-400">{player.winRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Winnings:</span>
                        <span className="text-emerald-400">{player.totalWinnings} ETH</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        {filteredData.length > 0 && currentCategory ? (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">📊 COMPLETE RANKINGS</h2>
            <div className="space-y-4">
              {rest.map((player, index) => (
                <Card key={player.address} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-300">{index + 4}</span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {formatAddress(player.address)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span>Created: {player.gamesCreated}</span>
                            <span>Joined: {player.gamesJoined}</span>
                            <span>Quick Draw: {player.quickDrawGames}</span>
                            <span>Strategic: {player.strategicGames}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-2xl font-bold text-yellow-400">
                          {getDisplayValue(player, currentCategory)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {player.gamesWon}W / {player.gamesLost}L
                        </div>
                        <div className="text-sm text-emerald-400">
                          {player.totalWinnings} ETH
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : !isLoading && (
          <div className="text-center py-16">
            <Trophy className="w-24 h-24 mx-auto mb-6 text-slate-500" />
            <h3 className="text-2xl font-bold text-white mb-2">No players found</h3>
            <p className="text-slate-400">
              {searchTerm ? "Try adjusting your search" : "No players have completed games yet"}
            </p>
          </div>
        )}

        {/* Stats Summary */}
        {leaderboardData.length > 0 && (
          <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
              <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
              Leaderboard Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{leaderboardData.length}</div>
                <div className="text-sm text-slate-400">Active Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {leaderboardData.length > 0 
                    ? Math.round(leaderboardData.reduce((sum, p) => sum + p.winRate, 0) / leaderboardData.length)
                    : 0
                  }%
                </div>
                <div className="text-sm text-slate-400">Average Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {leaderboardData.reduce((sum, p) => sum + p.totalGames, 0)}
                </div>
                <div className="text-sm text-slate-400">Total Games</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-400">
                  {leaderboardData.reduce((sum, p) => sum + parseFloat(p.totalWinnings), 0).toFixed(4)} ETH
                </div>
                <div className="text-sm text-slate-400">Total Winnings</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}