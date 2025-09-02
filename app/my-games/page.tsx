"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Gamepad2, 
  Target, 
  Brain, 
  Clock, 
  Play, 
  Trophy, 
  Search,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Plus,
  Timer,
  Users,
  Crown,
  Bug,
  Zap,
  Swords,
  TrendingUp,
  Wallet,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useGameNavigation } from "@/hooks/useGameNavigation"
import { useGameContext } from "@/context/GameContext"
import { toast } from "react-hot-toast"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import SimpleDebugMyGames from "@/components/debug/SimpleDebugMyGames"

// Enhanced game interface for UI - supports both ZeroSum and Hardcore
// NOTE: Game ID offset system to prevent duplicates across contracts:
// - ZeroSum games: Keep original IDs (1, 2, 3, 4, 5...)
// - Hardcore games: Add 10000 offset (10001, 10002, 10003, 10004, 10005...)
interface EnhancedGameData {
  gameId: number
  mode: "Quick Draw" | "Strategic" | "Hardcore Mystery" | "Last Stand"
  currentNumber?: number // Only for ZeroSum games
  currentPlayer: string
  status: "waiting" | "active" | "completed"
  entryFee: string
  prizePool: string
  winner?: string
  numberGenerated?: boolean // Only for ZeroSum games
  maxPlayers?: number // Only for Hardcore games
  moveCount?: number // Only for Hardcore games
  isStarted?: boolean // Only for Hardcore games
  
  // User-specific
  myTurn: boolean
  isCreator: boolean
  players: string[]
  timeLeft: number
  
  // Contract type
  contractType: 'zerosum' | 'hardcore'
}

export default function MyGamesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  console.log('🔌 Wallet state:', { address, isConnected })
  
  // Use GameContext instead of direct hooks to prevent duplicate fetching
  const { 
    myGames: contextGames, 
    gameStats, 
    isLoading: contextLoading, 
    error: contextError,
    fetchMyGames: contextFetchMyGames,
    lastFetchTime
  } = useGameContext()
  
  console.log('🎮 GameContext state:', { 
    gamesCount: contextGames.length, 
    isLoading: contextLoading, 
    error: contextError,
    lastFetchTime 
  })
  
  // Use the navigation hook
  const { navigateToGame } = useGameNavigation()
  
  // Local state for games
  const [myGames, setMyGames] = useState<EnhancedGameData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "waiting" | "active" | "completed" | "my-turn">("all")
  const [showDebug, setShowDebug] = useState(false)

  // Fetch games from context
  const fetchMyGames = useCallback(async (force = false) => {
    if (force || Date.now() - lastFetch > 30000) { // 30 second cache
      console.log('🔄 Fetching my games...')
      setIsLoading(true)
      setError(null)
      
      try {
        await contextFetchMyGames()
        setLastFetch(Date.now())
      } catch (err) {
        console.error('❌ Error fetching games:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch games')
      } finally {
        setIsLoading(false)
      }
    }
  }, [contextFetchMyGames, lastFetch])

  // Initial fetch
  useEffect(() => {
    if (isConnected && address) {
      fetchMyGames()
    }
  }, [isConnected, address, fetchMyGames])

  // Update local games when context changes
  useEffect(() => {
    if (contextGames.length > 0) {
      setMyGames(contextGames)
    }
  }, [contextGames])

  // Refresh function
  const refresh = useCallback(() => {
    fetchMyGames(true)
  }, [fetchMyGames])

  // Calculate stats
  const stats = {
    totalGames: myGames.length,
    activeGames: myGames.filter(g => g.status === "active").length,
    waitingGames: myGames.filter(g => g.status === "waiting").length,
    completedGames: myGames.filter(g => g.status === "completed").length,
    myTurnGames: myGames.filter(g => g.myTurn && g.status === "active").length,
    gamesAsCreator: myGames.filter(g => g.isCreator).length,
    gamesAsPlayer: myGames.filter(g => !g.isCreator).length,
    totalWinnings: myGames
      .filter(g => g.status === "completed" && g.winner?.toLowerCase() === address?.toLowerCase())
      .reduce((sum, g) => sum + parseFloat(g.entryFee) * 2, 0)
      .toFixed(4)
  }

  // Get games that need immediate attention
  const myTurnGames = myGames.filter(g => g.myTurn && g.status === "active")
  const urgentGames = myGames.filter(g => g.status === "active" && g.timeLeft <= 60)

  const hasUrgentActions = () => myTurnGames.length > 0 || urgentGames.length > 0

  // Filter games based on search and filter
  const filteredGames = myGames.filter((game) => {
    const matchesSearch = 
      game.gameId.toString().includes(searchTerm) ||
      game.mode.toLowerCase().includes(searchTerm.toLowerCase())
    
    switch (selectedFilter) {
      case "all": return matchesSearch
      case "my-turn": return matchesSearch && game.myTurn && game.status === "active"
      default: return matchesSearch && game.status === selectedFilter
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-600/30 text-emerald-100 border-emerald-500/50"
      case "waiting": return "bg-amber-600/30 text-amber-100 border-amber-500/50"
      case "completed": return "bg-violet-600/30 text-violet-100 border-violet-500/50"
      default: return "bg-slate-600/30 text-slate-100 border-slate-500/50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="w-4 h-4" />
      case "waiting": return <Clock className="w-4 h-4" />
      case "completed": return <Trophy className="w-4 h-4" />
      default: return <Gamepad2 className="w-4 h-4" />
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "Quick Draw": return <Target className="w-6 h-6 text-white" />
      case "Strategic": return <Brain className="w-6 h-6 text-white" />
      case "Hardcore Mystery": return <Zap className="w-6 h-6 text-white" />
      case "Last Stand": return <Swords className="w-6 h-6 text-white" />
      default: return <Gamepad2 className="w-6 h-6 text-white" />
    }
  }

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Time up!"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getUrgencyColor = (timeLeft: number) => {
    if (timeLeft <= 30) return "text-red-200"
    if (timeLeft <= 60) return "text-amber-200"
    return "text-slate-200"
  }

  // Utility functions for game ID offset system
  const isHardcoreGame = (gameId: number) => gameId > 10000
  const getActualGameId = (gameId: number, contractType: 'zerosum' | 'hardcore') => {
    if (contractType === 'hardcore') {
      return gameId - 10000
    }
    return gameId
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400">Please connect your wallet to view your games</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <UnifiedGamingNavigation />
      
      <div className="relative  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-6 py-2 mb-6">
            <span className="text-cyan-400 font-bold">MY GAMES (ZeroSum + Hardcore)</span>
            {hasUrgentActions() && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <h1 className="text-5xl font-black text-white mb-4">GAME DASHBOARD</h1>
          <p className="text-xl text-slate-300 font-medium">Track and manage all your battles</p>
          
          {/* Debug Toggle */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-400 hover:text-white"
            >
              <Bug className="w-4 h-4 mr-2" />
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </Button>
            
            <Button
              onClick={() => {
                console.log('🔄 Manual debug refresh clicked')
                console.log('Current state:', { myGames: myGames.length, isLoading, error, address, isConnected, contextLoading, contextError })
                fetchMyGames(true)
              }}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Debug Refresh
            </Button>
          </div>
          
          {/* Urgent Actions Alert */}
          {hasUrgentActions() && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium">
                  You have {myTurnGames.length} game{myTurnGames.length > 1 ? 's' : ''} waiting for your move!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        {showDebug && <SimpleDebugMyGames />}

        {/* Consolidated Stats Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Stats Card */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-700/90 border border-slate-600/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-cyan-300" />
                Game Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-600/30 rounded-xl border border-emerald-500/50 shadow-lg">
                  <div className="text-3xl font-black text-emerald-100">{stats.totalGames}</div>
                  <div className="text-sm text-emerald-50 font-medium">Total Games</div>
                </div>
                <div className="text-center p-4 bg-blue-600/30 rounded-xl border border-blue-500/50 shadow-lg">
                  <div className="text-3xl font-black text-blue-100">{stats.activeGames}</div>
                  <div className="text-sm text-blue-50 font-medium">Active</div>
                </div>
                <div className="text-center p-4 bg-amber-600/30 rounded-xl border border-amber-500/50 shadow-lg">
                  <div className="text-2xl font-black text-amber-100">{stats.waitingGames}</div>
                  <div className="text-sm text-amber-50 font-medium">Waiting</div>
                </div>
                <div className="text-center p-4 bg-violet-600/30 rounded-xl border border-violet-500/50 shadow-lg">
                  <div className="text-2xl font-black text-violet-100">{stats.completedGames}</div>
                  <div className="text-sm text-violet-50 font-medium">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Actions Card */}
          <Card className="bg-gradient-to-br from-red-700/80 to-orange-700/80 border border-red-500/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Timer className="w-5 h-5 mr-2 text-red-200" />
                Urgent Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myTurnGames.length > 0 ? (
                <div className="text-center">
                  <div className="text-4xl font-black text-red-100 mb-2">{myTurnGames.length}</div>
                  <div className="text-sm text-red-50 font-medium mb-3">Games Waiting</div>
                  <Button 
                    onClick={() => navigateToGame(myTurnGames[0].gameId)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Now!
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl font-black text-green-200 mb-2">✓</div>
                  <div className="text-sm text-green-100 font-medium">All Caught Up</div>
                  <p className="text-xs text-slate-100 mt-2">No urgent actions needed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setSelectedFilter("all")}
              variant={selectedFilter === "all" ? "default" : "outline"}
              className="bg-slate-600 hover:bg-slate-700 border-slate-500"
            >
              All ({stats.totalGames})
            </Button>
            <Button
              onClick={() => setSelectedFilter("my-turn")}
              variant={selectedFilter === "my-turn" ? "default" : "outline"}
              className="bg-red-600 hover:bg-red-700 border-red-500"
            >
              My Turn ({stats.myTurnGames})
            </Button>
            <Button
              onClick={() => setSelectedFilter("waiting")}
              variant={selectedFilter === "waiting" ? "default" : "outline"}
              className="bg-amber-600 hover:bg-amber-700 border-amber-500"
            >
              Waiting ({stats.waitingGames})
            </Button>
            <Button
              onClick={() => setSelectedFilter("active")}
              variant={selectedFilter === "active" ? "default" : "outline"}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
            >
              Active ({stats.activeGames})
            </Button>
            <Button
              onClick={() => setSelectedFilter("completed")}
              variant={selectedFilter === "completed" ? "default" : "outline"}
              className="bg-violet-600 hover:bg-violet-700 border-violet-500"
            >
              Completed ({stats.completedGames})
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600 text-white w-64"
              />
            </div>
            
            <Button
              onClick={refresh}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Loading/Error States */}
        {isLoading && myGames.length > 0 && (
          <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <p className="text-blue-400 font-medium">Refreshing game data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Error: {error}</p>
              <Button 
                onClick={() => setError(null)} 
                size="sm" 
                variant="outline"
                className="border-red-500/30 text-red-400 ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
         
        {/* ZeroSum Contract Status Warning */}
        {myGames.filter(g => g.contractType === 'zerosum').length === 0 && 
         myGames.filter(g => g.contractType === 'hardcore').length > 0 && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-amber-400 font-medium">ZeroSum Games Not Loading</p>
                <p className="text-amber-300 text-sm mt-1">
                  Hardcore Mystery games are working, but ZeroSum games (Quick Draw & Strategic) are not loading. 
                  This may be due to network connectivity issues with the ZeroSum contract.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Games List */}
        {isLoading && myGames.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-xl font-bold text-white">Loading your games...</p>
              <p className="text-slate-400">Fetching from ZeroSum and Hardcore contracts</p>
            </div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="w-24 h-24 mx-auto mb-6 text-slate-500" />
            <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || selectedFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Create or join a battle to get started!"
              }
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/create">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Battle
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Browse Battles
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGames.map((game) => (
                             <Card key={game.gameId} className={`bg-slate-800/80 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${
                 game.myTurn && game.status === "active" 
                   ? 'border-red-500/60 hover:border-red-500/80 shadow-red-500/30' 
                   : 'border-slate-600/60 hover:border-slate-500/70'
               }`}>
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                       <div className={`w-16 h-16 bg-gradient-to-br ${
                         game.mode === "Quick Draw" 
                           ? "from-emerald-500 to-teal-600" 
                           : game.mode === "Strategic"
                           ? "from-blue-500 to-indigo-600"
                           : game.mode === "Hardcore Mystery"
                           ? "from-rose-500 to-red-600"
                           : "from-orange-500 to-pink-600"
                       } rounded-xl flex items-center justify-center shadow-lg`}>
                         {getModeIcon(game.mode)}
                       </div>
                       
                       <div className="flex-1">
                         <div className="flex items-center space-x-3 mb-3">
                           <h3 className="text-xl font-black text-white">Battle #{game.gameId}</h3>
                           <Badge className={getStatusColor(game.status)}>
                             <div className="flex items-center space-x-1">
                               {getStatusIcon(game.status)}
                               <span>{game.status.toUpperCase()}</span>
                             </div>
                           </Badge>
                           {game.isCreator && (
                             <Badge className="bg-blue-600/30 text-blue-100 border-blue-500/50">
                               <Crown className="w-3 h-3 mr-1" />
                               CREATOR
                             </Badge>
                           )}
                           {game.myTurn && game.status === "active" && (
                             <Badge className="bg-red-600/30 text-red-100 border-red-500/50 animate-pulse">
                               <Timer className="w-3 h-3 mr-1" />
                               YOUR TURN
                             </Badge>
                           )}
                         </div>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                           <div>
                             <span className="text-slate-300">Mode:</span>
                             <span className="ml-2 text-white font-medium">{game.mode}</span>
                           </div>
                           <div>
                             <span className="text-slate-300">Contract:</span>
                             <span className={`ml-2 font-medium ${
                               game.contractType === 'hardcore' 
                                 ? 'text-rose-300' 
                                 : 'text-blue-300'
                             }`}>
                               {game.contractType === 'hardcore' ? 'Hardcore' : 'ZeroSum'}
                             </span>
                           </div>
                           <div>
                             <span className="text-slate-300">Players:</span>
                             <span className="ml-2 text-white font-medium">
                               {game.players.length}/{game.contractType === 'hardcore' ? (game.maxPlayers || 2) : 2}
                             </span>
                           </div>
                           <div>
                             <span className="text-slate-300">Entry Fee:</span>
                             <span className="ml-2 text-emerald-300 font-medium">
                               {parseFloat(game.entryFee).toFixed(4)} MNT
                             </span>
                           </div>
                         </div>
                         
                         {game.status === "active" && game.currentNumber && (
                           <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                             <span className="text-slate-300">Current Number:</span>
                             <span className="ml-2 text-cyan-300 font-bold text-lg">{game.currentNumber}</span>
                           </div>
                         )}
                         
                         {game.status === "completed" && game.winner && (
                           <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                             <span className="text-slate-300">Winner:</span>
                             <span className={`ml-2 font-bold text-lg ${
                               game.winner.toLowerCase() === address?.toLowerCase() 
                                 ? 'text-emerald-300' 
                                 : 'text-slate-300'
                             }`}>
                               {game.winner.toLowerCase() === address?.toLowerCase() 
                                 ? '🏆 You Won!' 
                                 : 'Opponent Won'
                               }
                             </span>
                           </div>
                         )}
                         
                         {game.timeLeft > 0 && game.status === "active" && (
                           <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                             <span className="text-slate-300">Time Left:</span>
                             <span className={`ml-2 font-mono font-bold text-lg ${getUrgencyColor(game.timeLeft)}`}>
                               {formatTimeLeft(game.timeLeft)}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                    
                    <div className="flex flex-col space-y-3 min-w-[140px]">
                      <Button 
                        onClick={() => {
                          if (game.contractType === 'hardcore') {
                            // Check if it's Last Stand mode - route to normal waiting room
                            if (game.mode === "Last Stand") {
                              // Last Stand games go to normal waiting room
                              if (game.status === "waiting") {
                                router.push(`/battle/waiting/${game.gameId}`)
                              } else {
                                router.push(`/battle/${game.gameId}`)
                              }
                            } else {
                              // Hardcore Mystery games go to hardcore waiting room
                              const actualGameId = getActualGameId(game.gameId, 'hardcore')
                              if (game.status === "waiting") {
                                router.push(`/battle/hardcore/waiting/${actualGameId}`)
                              } else {
                                router.push(`/battle/hardcore/${actualGameId}`)
                              }
                            }
                          } else {
                            navigateToGame(game.gameId)
                          }
                        }}
                        className={`${
                          game.myTurn && game.status === "active"
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                        } text-white rounded-lg w-full`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {game.status === "active" 
                          ? game.myTurn ? "MAKE MOVE" : "Continue"
                          : game.status === "waiting" 
                            ? "Enter Game" 
                            : "View Game"
                        }
                      </Button>
                      
                      {game.status === "waiting" && (
                        <div className="text-center">
                          <p className="text-xs text-amber-400 mb-2">
                            {game.isCreator ? "Waiting for opponent..." : "Game starting soon..."}
                          </p>
                          {game.isCreator && (
                            <Button
                              onClick={() => {
                                const url = game.contractType === 'hardcore' 
                                  ? game.mode === "Last Stand"
                                    ? `${window.location.origin}/battle/${game.status === "waiting" ? "waiting/" : ""}${game.gameId}`
                                    : `${window.location.origin}/battle/hardcore/${game.status === "waiting" ? "waiting/" : ""}${getActualGameId(game.gameId, 'hardcore')}`
                                  : `${window.location.origin}/battle/${game.gameId}`
                                navigator.clipboard.writeText(url)
                                toast.success("Game link copied!")
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full text-xs border-slate-600 text-slate-300"
                            >
                              Copy Link
                            </Button>
                          )}
                        </div>
                      )}

                      {game.status === "active" && !game.myTurn && (
                        <div className="text-center">
                          <p className="text-xs text-blue-400">Opponent's turn</p>
                          <p className="text-xs text-slate-400">
                            {formatTimeLeft(game.timeLeft)} remaining
                          </p>
                        </div>
                      )}

                      {game.status === "completed" && (
                        <div className="text-center">
                          <p className={`text-xs font-bold ${
                            game.winner?.toLowerCase() === address?.toLowerCase()
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}>
                            {game.winner?.toLowerCase() === address?.toLowerCase()
                              ? '🏆 Victory!'
                              : '💀 Defeat'
                            }
                          </p>
                          {game.winner?.toLowerCase() === address?.toLowerCase() && (
                            <p className="text-xs text-emerald-300">
                              +{(parseFloat(game.entryFee) * 2).toFixed(4)} MNT
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4">
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Create New Battle
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl px-8 py-3">
                <Gamepad2 className="w-5 h-5 mr-2" />
                Browse All Battles
              </Button>
            </Link>
            {myTurnGames.length > 0 && (
              <Button 
                onClick={() => navigateToGame(myTurnGames[0].gameId)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 py-3 animate-pulse">
                <Timer className="w-5 h-5 mr-2" />
                Play Now!
              </Button>
            )}
          </div>
        </div>

                 {/* Player Stats Summary */}
         {stats.totalGames > 0 && (
           <div className="mt-12 p-6 bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/60 rounded-xl">
             <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center">
               <TrendingUp className="w-5 h-5 mr-2 text-cyan-300" />
               Your Gaming Stats
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
               <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                 <div className="text-2xl font-bold text-emerald-200">{stats.gamesAsCreator}</div>
                 <div className="text-sm text-slate-200">Games Created</div>
               </div>
               <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                 <div className="text-2xl font-bold text-blue-200">{stats.gamesAsPlayer}</div>
                 <div className="text-sm text-slate-200">Games Joined</div>
               </div>
               <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                 <div className="text-2xl font-bold text-amber-200">
                   {stats.completedGames > 0 
                     ? Math.round((myGames.filter(g => g.status === "completed" && g.winner?.toLowerCase() === address?.toLowerCase()).length / stats.completedGames) * 100)
                     : 0
                   }%
                 </div>
                 <div className="text-sm text-slate-200">Win Rate</div>
               </div>
               <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                 <div className="text-2xl font-bold text-violet-200">{stats.totalWinnings} MNT</div>
                 <div className="text-sm text-slate-200">Total Winnings</div>
               </div>
             </div>
           </div>
         )}

        {/* Debug Info */}
        {showDebug && (
          <div className="mt-8 p-4 bg-slate-800/40 border border-slate-600/50 rounded-xl">
            <h4 className="font-semibold text-white mb-2">Debug Information:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Context Ready:</span>
                <span className={`ml-2 ${!contextError ? 'text-green-400' : 'text-red-400'}`}>
                  {!contextError ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Loading:</span>
                <span className={`ml-2 ${contextLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                  {contextLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Games Loaded:</span>
                <span className="ml-2 text-cyan-400">{myGames.length}</span>
              </div>
              <div>
                <span className="text-slate-400">Last Fetch:</span>
                <span className="ml-2 text-slate-300">
                  {lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={() => fetchMyGames(true)} 
              size="sm" 
              className="mt-3 bg-purple-600 hover:bg-purple-700"
            >
              Force Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}