"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gamepad2,
  Coins,
  Swords,
  Target,
  Brain,
  Eye,
  Zap,
  Loader2,
  RefreshCw,
  Users,
  Clock,
  Trophy,
  Search,
  Filter,
  Wallet,
  ExternalLink,
  Copy,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount } from "wagmi"
import { toast } from "react-hot-toast"
import {
  useZeroSumData,
  useZeroSumContract,
  GameData,
  GameStatus,
  GameMode
} from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { getGameUrl } from "@/utils/farcaster"

// Enhanced battle data for browse page
interface BrowsableGame extends GameData {
  players: string[]
  canJoin: boolean
  canWatch: boolean
  timeLeft?: number
  isCreator?: boolean
}

interface BrowseFilters {
  id: string
  name: string
  count: number
  icon: any
}

interface BrowseStats {
  totalGames: number
  quickDrawGames: number
  strategicGames: number
  totalPrizePool: string
  waitingGames: number
  activeGames: number
}

export default function UpdatedBrowseGamesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  
  // Get highlight game ID from URL params
  const highlightGameId = searchParams.get('highlight')
  
  // Blockchain hooks
  const {
    getGameCounter,
    getGame,
    getPlayers,
    isGameBettable,
    getGamesBatch,
    contractsReady,
    providerReady
  } = useZeroSumData()
  
  const { joinGame, loading: contractLoading } = useZeroSumContract()

  // State management
  const [browsableGames, setBrowsableGames] = useState<BrowsableGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [joiningBattle, setJoiningBattle] = useState<number | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<string>("")
  const [browseStats, setBrowseStats] = useState<BrowseStats>({
    totalGames: 0,
    quickDrawGames: 0,
    strategicGames: 0,
    totalPrizePool: "0",
    waitingGames: 0,
    activeGames: 0
  })

  // Fetch browsable games from blockchain - OPTIMIZED VERSION
  const fetchBrowsableGames = useCallback(async () => {
    console.log('🎮 Fetching browsable games (OPTIMIZED)...')
    setIsLoading(true)
    setError(null)

    // Declare validGames at function level to ensure it's always available
    let validGames: Array<{
      game: GameData
      players: string[]
      bettable: boolean
      gameId: number
    }> = []

    try {
      // Get total game counter
      const gameCounter = await getGameCounter()
      console.log(`📊 Total games on contract: ${gameCounter}`)

      if (gameCounter <= 1) {
        // No games exist yet
        setBrowsableGames([])
        setBrowseStats({
          totalGames: 0,
          quickDrawGames: 0,
          strategicGames: 0,
          totalPrizePool: "0",
          waitingGames: 0,
          activeGames: 0
        })
        setLastFetchTime(new Date().toLocaleTimeString())
        return
      }

      // ✅ OPTIMIZED: Use getGamesBatch instead of individual calls
      const gameIds = Array.from({ length: gameCounter - 1 }, (_, i) => i + 1)
      console.log(`🚀 Batch fetching ${gameIds.length} games...`)
      
      try {
        // Try optimized batch call first
        const games = await getGamesBatch(gameIds)
        console.log(`✅ Batch fetch successful: ${games.length} games`)
        
        // Filter games that can be browsed and get additional data sequentially to avoid RPC rate limits
        const browsableGames = games.filter(game => 
          game && (
            game.status === GameStatus.WAITING || 
            game.status === GameStatus.ACTIVE
          )
        )
        
        console.log(`🎮 Processing ${browsableGames.length} browsable games sequentially...`)
        
        const gameResults = []
        for (const game of browsableGames) {
          try {
            // Get additional data needed for browsing sequentially
            console.log(`🔍 Processing game ${game.gameId}...`)
            const players = await getPlayers(game.gameId)
            console.log(`🎮 Game ${game.gameId} players:`, players)
            
            // Add small delay to respect RPC rate limits
            await new Promise(resolve => setTimeout(resolve, 200))
            
            const bettable = await isGameBettable(game.gameId)
            
            gameResults.push({ game, players, bettable, gameId: game.gameId })
          } catch (error) {
            console.warn(`Failed to get additional data for game ${game.gameId}:`, error)
            // Still add the game with empty data so it shows up
            gameResults.push({ 
              game, 
              players: [], 
              bettable: false, 
              gameId: game.gameId 
            })
          }
        }
        validGames = gameResults.filter(result => result !== null) as Array<{
          game: GameData
          players: string[]
          bettable: boolean
          gameId: number
        }>

        console.log(`✅ Found ${validGames.length} browsable games (optimized)`)
        
      } catch (batchError) {
        console.log('⚠️ Batch fetch failed, falling back to individual calls:', batchError)
        
        // ❌ FALLBACK: Individual calls if batch fails
        const gamePromises = []
        for (let i = 1; i < gameCounter; i++) {
          gamePromises.push(
            Promise.all([
              getGame(i),
              getPlayers(i),
              isGameBettable(i)
            ]).then(([game, players, bettable]) => {
              console.log(`🎮 Batch fetch - Game ${i} players:`, players)
              if (game && (game.status === GameStatus.WAITING || game.status === GameStatus.ACTIVE || bettable)) {
                return { game, players, bettable, gameId: i }
              }
              return null
            }).catch(error => {
              console.warn(`Failed to fetch game ${i}:`, error)
              return null
            })
          )
        }

        const gameResults = await Promise.all(gamePromises)
        validGames = gameResults.filter(result => result !== null) as Array<{
          game: GameData
          players: string[]
          bettable: boolean
          gameId: number
        }>

        console.log(`✅ Found ${validGames.length} browsable games (fallback)`)
      }
      // Transform to browsable format
      const browsable: BrowsableGame[] = validGames.map(({ game, players, bettable }) => {
        console.log(`🎮 Final browsable game ${game.gameId}:`, { 
          status: game.status, 
          players: players, 
          playersLength: players.length 
        })
        
        const canJoin = game.status === GameStatus.WAITING && 
                       players.length < 2 && 
                       (!isConnected || !players.some(p => p.toLowerCase() === address?.toLowerCase()))
        const canWatch = game.status === GameStatus.ACTIVE || bettable
        
        const isCreator = isConnected && address && players.length > 0 && 
                         players[0].toLowerCase() === address.toLowerCase()

        return {
          ...game,
          players,
          canJoin,
          canWatch,
          isCreator
        }
      })

      // Calculate stats
      const stats: BrowseStats = {
        totalGames: browsable.length,
        quickDrawGames: browsable.filter(g => g.mode === GameMode.QUICK_DRAW).length,
        strategicGames: browsable.filter(g => g.mode === GameMode.STRATEGIC).length,
        totalPrizePool: browsable.reduce((sum, g) => sum + parseFloat(g.prizePool), 0).toFixed(4),
        waitingGames: browsable.filter(g => g.status === GameStatus.WAITING).length,
        activeGames: browsable.filter(g => g.status === GameStatus.ACTIVE).length
      }

      setBrowsableGames(browsable)
      setBrowseStats(stats)
      setLastFetchTime(new Date().toLocaleTimeString())
      console.log('✅ Browse data updated:', { games: browsable.length, stats })

    } catch (error) {
      console.error('❌ Error fetching browsable games:', error)
      setError(error instanceof Error ? error.message : 'Failed to load games')
    } finally {
      setIsLoading(false)
    }
  }, [getGameCounter, getGame, getPlayers, isGameBettable, isConnected, address])

  // Initial data fetch
  useEffect(() => {
    if (providerReady) {
      fetchBrowsableGames()
    }
  }, [providerReady, fetchBrowsableGames])

  // Create filter options
  const filters: BrowseFilters[] = [
    { id: "all", name: "All Games", count: browseStats.totalGames, icon: Gamepad2 },
    { id: "waiting", name: "Waiting", count: browseStats.waitingGames, icon: Clock },
    { id: "active", name: "Active", count: browseStats.activeGames, icon: Swords },
    { id: "quick-draw", name: "Quick Draw", count: browseStats.quickDrawGames, icon: Target },
    { id: "strategic", name: "Strategic", count: browseStats.strategicGames, icon: Brain }
  ]

  // Filter games based on search and selected filter
  const filteredGames = browsableGames.filter((game) => {
    const matchesSearch = 
      game.gameId.toString().includes(searchTerm) ||
      (game.mode === GameMode.QUICK_DRAW ? "quick draw" : "strategic").includes(searchTerm.toLowerCase())
    
    switch (selectedFilter) {
      case "all": return matchesSearch
      case "waiting": return matchesSearch && game.status === GameStatus.WAITING
      case "active": return matchesSearch && game.status === GameStatus.ACTIVE
      case "quick-draw": return matchesSearch && game.mode === GameMode.QUICK_DRAW
      case "strategic": return matchesSearch && game.mode === GameMode.STRATEGIC
      default: return matchesSearch
    }
  })

  // Scroll to highlighted game when it loads
  useEffect(() => {
    if (highlightGameId && filteredGames.length > 0) {
      const gameExists = filteredGames.some(game => game.gameId === Number(highlightGameId))
      if (gameExists) {
        setTimeout(() => {
          const element = document.getElementById(`game-${highlightGameId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500) // Small delay to ensure rendering
      }
    }
  }, [highlightGameId, filteredGames])

  // Action handlers
  const handleJoinBattle = async (gameId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to join battles!")
      return
    }

    const game = browsableGames.find(g => g.gameId === gameId)
    if (!game) {
      toast.error("Game not found!")
      return
    }

    if (!game.canJoin) {
      toast.error("Cannot join this game!")
      return
    }

    setJoiningBattle(gameId)
    
    try {
      console.log(`🎮 Joining game ${gameId} with entry fee ${game.entryFee} ETH`)
      const result = await joinGame(gameId, game.entryFee)
      
      if (result.success) {
        toast.success("Successfully joined the battle!")
        // Redirect to battle page
        setTimeout(() => {
          router.push(`/battle/${gameId}`)
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error joining battle:', error)
      toast.error("Failed to join battle")
    } finally {
      setJoiningBattle(null)
    }
  }

  const handleWatchBattle = (gameId: number) => {
    router.push(`/battle/${gameId}`)
  }

  const copyGameLink = (gameId: number) => {
    const url = getGameUrl(gameId)
    navigator.clipboard.writeText(url)
    toast.success("Game link copied!")
  }

  // Utility functions
  const getGameModeName = (mode: GameMode) => {
    return mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic"
  }

  const getGameModeIcon = (mode: GameMode) => {
    return mode === GameMode.QUICK_DRAW ? Target : Brain
  }

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case GameStatus.WAITING: return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case GameStatus.ACTIVE: return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: GameStatus) => {
    switch (status) {
      case GameStatus.WAITING: return Clock
      case GameStatus.ACTIVE: return Swords
      default: return Gamepad2
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <UnifiedGamingNavigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-full px-6 py-2 mb-6">
            <Swords className="w-5 h-5 text-rose-400" />
            <span className="text-rose-400 font-bold">ACTIVE BATTLES</span>
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">CHOOSE YOUR BATTLE</h1>
          <p className="text-xl text-slate-300 font-medium">Join ongoing battles or spectate the warfare</p>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: {lastFetchTime || "Never"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by game ID or mode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white rounded-xl"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => {
              const Icon = filter.icon
              return (
                <Button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  className={`${
                    selectedFilter === filter.id
                      ? "bg-cyan-600 hover:bg-cyan-700 border-cyan-500"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  } rounded-xl`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {filter.name} ({filter.count})
                </Button>
              )
            })}
          </div>

          {/* Refresh */}
          <Button
            onClick={fetchBrowsableGames}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-xl text-slate-300">Loading battles from blockchain...</p>
            <p className="text-sm text-slate-400 mt-2">
              Fetching game data from smart contracts...
            </p>
          </div>
        )}

        {/* Games Grid */}
        {!isLoading && filteredGames.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGames.map((game) => {
              const ModeIcon = getGameModeIcon(game.mode)
              const StatusIcon = getStatusIcon(game.status)
              
              return (
                <Card id={`game-${game.gameId}`} key={game.gameId} className={`bg-slate-800/60 backdrop-blur-sm border transition-colors ${
                  highlightGameId && Number(highlightGameId) === game.gameId
                    ? "border-amber-500/70 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30"
                    : "border-slate-700/50 hover:border-slate-600/50"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${
                          game.mode === GameMode.QUICK_DRAW 
                            ? "from-emerald-400 to-teal-600" 
                            : "from-blue-400 to-indigo-600"
                        } rounded-xl flex items-center justify-center`}>
                          <ModeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-white">
                            {getGameModeName(game.mode)}
                          </CardTitle>
                          <p className="text-slate-400 text-sm">Battle #{game.gameId}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(game.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {game.status === GameStatus.WAITING ? "WAITING" : "ACTIVE"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {/* Highlight Message */}
                  {highlightGameId && Number(highlightGameId) === game.gameId && (
                    <div className="px-6 py-2 bg-amber-500/10 border-t border-amber-500/30">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <p className="text-amber-400 text-sm font-medium">
                          This is the game you were looking for! Connect your wallet to join.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="space-y-4">
                    {/* Game Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-slate-400">Entry Fee</span>
                        </div>
                        <div className="font-bold text-emerald-400">
                          {parseFloat(game.entryFee).toFixed(4)} ETH
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Trophy className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-slate-400">Prize Pool</span>
                        </div>
                        <div className="font-bold text-cyan-400">
                          {parseFloat(game.prizePool).toFixed(4)} ETH
                        </div>
                      </div>
                    </div>

                    {/* Players */}
                    <div className="bg-slate-700/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-medium text-white">
                          Players ({game.players.length}/2)
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {game.players.map((player, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">
                              {index === 0 ? "Creator" : "Player 2"}:
                            </span>
                            <span className="font-mono text-cyan-400">
                              {player.slice(0, 6)}...{player.slice(-4)}
                            </span>
                          </div>
                        ))}
                        
                        {game.players.length < 2 && (
                          <div className="text-xs text-amber-400 text-center py-1">
                            Waiting for opponent...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Game Rules Preview */}
                    <div className="text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2">
                      {game.mode === GameMode.QUICK_DRAW
                        ? "⚡ Subtract exactly 1 each turn - reach 0 to WIN!"
                        : "🧠 Subtract 10-30% each turn - force opponent to hit 0!"
                      }
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {game.canJoin && (
                        <Button
                          onClick={() => handleJoinBattle(game.gameId)}
                          disabled={!isConnected || joiningBattle === game.gameId || contractLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        >
                          {joiningBattle === game.gameId ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : !isConnected ? (
                            <Wallet className="w-4 h-4 mr-2" />
                          ) : (
                            <Swords className="w-4 h-4 mr-2" />
                          )}
                          {joiningBattle === game.gameId ? "Joining..." : 
                           !isConnected ? "Connect to Join" : "JOIN"}
                        </Button>
                      )}
                      
                      {game.canWatch && (
                        <Button
                          onClick={() => handleWatchBattle(game.gameId)}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                      )}
                      
                      {game.status === GameStatus.WAITING && (
                        <Button
                          onClick={() => copyGameLink(game.gameId)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Additional Info */}
                    {!isConnected && game.canJoin && (
                      <div className="text-xs text-center text-amber-400 bg-amber-500/10 rounded p-2">
                        💡 Connect your wallet to join this battle
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredGames.length === 0 && (
          <div className="text-center py-12">
            {browsableGames.length === 0 ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Swords className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Active Battles Found</h3>
                  <p className="text-slate-400 mb-6">
                    Be the first warrior to create a battle!
                  </p>
                  <Link href="/create">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl">
                      <Zap className="w-5 h-5 mr-2" />
                      CREATE BATTLE
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Filter className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Battles Match Your Filter</h3>
                  <p className="text-slate-400 mb-6">
                    No battles match your search "{searchTerm}" or filter "{selectedFilter}"
                  </p>
                  <div className="space-x-4">
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedFilter("all")
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      Clear Filters
                    </Button>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl">
                        <Zap className="w-5 h-5 mr-2" />
                        CREATE BATTLE
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!isLoading && browsableGames.length > 0 && (
          <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Battle Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{browseStats.totalGames}</div>
                <div className="text-sm text-slate-400">Total Battles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{browseStats.quickDrawGames}</div>
                <div className="text-sm text-slate-400">Quick Draw</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{browseStats.strategicGames}</div>
                <div className="text-sm text-slate-400">Strategic</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{browseStats.totalPrizePool} ETH</div>
                <div className="text-sm text-slate-400">Total Prize Pool</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-amber-400">{browseStats.waitingGames}</div>
                  <div className="text-sm text-slate-400">Waiting for Players</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-400">{browseStats.activeGames}</div>
                  <div className="text-sm text-slate-400">Active Battles</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4 flex-wrap gap-y-4 justify-center">
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-3">
                <Zap className="w-5 h-5 mr-2" />
                Create New Battle
              </Button>
            </Link>
            
            {isConnected && (
              <Link href="/my-games">
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl px-8 py-3">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  My Games
                </Button>
              </Link>
            )}
            
            <Button
              onClick={fetchBrowsableGames}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl px-8 py-3"
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Refreshing..." : "Refresh Battles"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}