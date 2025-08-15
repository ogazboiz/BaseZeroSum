"use client"

import { useState, useEffect } from "react"
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
  Bug
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useGameNavigation } from "@/hooks/useGameNavigation"
import { toast } from "react-hot-toast"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import SimpleDebugMyGames from "@/components/debug/SimpleDebugMyGames"

// Direct hook imports
import { useZeroSumData, GameData, GameMode, GameStatus } from "@/hooks/useZeroSumContract"

// Enhanced game interface for UI
interface EnhancedGameData extends GameData {
  myTurn: boolean
  isCreator: boolean
  players: string[]
  timeLeft: number
  status: "waiting" | "active" | "completed"
  mode: "Quick Draw" | "Strategic"
}

export default function MyGamesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  // Direct hook usage instead of GameContext
  const { 
    getUserGames, 
    getPlayerView, 
    getPlayers,
    contractsReady,
    providerReady 
  } = useZeroSumData()
  
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

  // Fetch my games function
  const fetchMyGames = async (force = false) => {
    if (!address || !isConnected || !contractsReady) {
      console.log('⚠️ Cannot fetch games:', { address, isConnected, contractsReady })
      return
    }

    // Avoid too frequent fetches unless forced
    const now = Date.now()
    if (!force && (now - lastFetch) < 3000) {
      console.log('⚠️ Skipping fetch - too recent')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Fetching my games for:', address)
      
      // Get user's games
      const result = await getUserGames(address, 0, 50)
      console.log('📊 Got games from hook:', result)
      
      if (!result.games || result.games.length === 0) {
        console.log('ℹ️ No games found for user')
        setMyGames([])
        setLastFetch(now)
        return
      }

      // Enhance each game with additional data
      const enhancedGames: EnhancedGameData[] = []
      
      for (const game of result.games) {
        try {
          console.log(`🎮 Processing game ${game.gameId}...`)
          
          // Get players for this game
          const players = await getPlayers(game.gameId)
          console.log(`👥 Game ${game.gameId} players:`, players)
          
          // Get player view if game is active
          let playerView = null
          let myTurn = false
          let timeLeft = 0
          
          if (game.status === GameStatus.ACTIVE) {
            try {
              playerView = await getPlayerView(game.gameId)
              myTurn = playerView?.yourTurn || false
              timeLeft = playerView?.timeLeft || 0
              console.log(`🎯 Game ${game.gameId} player view:`, { myTurn, timeLeft })
            } catch (viewError) {
              console.warn(`⚠️ Could not get player view for game ${game.gameId}:`, viewError)
            }
          }
          
          // Check if user is creator (first player)
          const isCreator = players.length > 0 && players[0].toLowerCase() === address.toLowerCase()
          
          // Convert status and mode to string format
          const statusString = game.status === GameStatus.WAITING ? "waiting" :
                              game.status === GameStatus.ACTIVE ? "active" : "completed"
          
          const modeString = game.mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic"
          
          const enhancedGame: EnhancedGameData = {
            ...game,
            myTurn,
            isCreator,
            players,
            timeLeft,
            status: statusString as "waiting" | "active" | "completed",
            mode: modeString as "Quick Draw" | "Strategic"
          }
          
          enhancedGames.push(enhancedGame)
          console.log(`✅ Enhanced game ${game.gameId}:`, enhancedGame)
          
        } catch (gameError) {
          console.error(`❌ Error processing game ${game.gameId}:`, gameError)
          // Still add the basic game data
          enhancedGames.push({
            ...game,
            myTurn: false,
            isCreator: false,
            players: [],
            timeLeft: 0,
            status: game.status === GameStatus.WAITING ? "waiting" :
                   game.status === GameStatus.ACTIVE ? "active" : "completed",
            mode: game.mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic"
          } as EnhancedGameData)
        }
      }
      
      console.log(`✅ Processed ${enhancedGames.length} games total`)
      setMyGames(enhancedGames)
      setLastFetch(now)
      
    } catch (fetchError: any) {
      console.error('❌ Failed to fetch my games:', fetchError)
      setError(fetchError.message || 'Failed to fetch games')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch games when component mounts or dependencies change
  useEffect(() => {
    if (isConnected && address && contractsReady && providerReady) {
      console.log('🚀 Auto-fetching games on mount/connection')
      fetchMyGames()
    } else {
      console.log('⏳ Waiting for connection...', { isConnected, address, contractsReady, providerReady })
    }
  }, [isConnected, address, contractsReady, providerReady])

  // Refresh function
  const refresh = () => {
    console.log('🔄 Manual refresh triggered')
    fetchMyGames(true)
  }

  // Calculate derived stats
  const stats = {
    totalGames: myGames.length,
    activeGames: myGames.filter(g => g.status === "active").length,
    waitingGames: myGames.filter(g => g.status === "waiting").length,
    completedGames: myGames.filter(g => g.status === "completed").length,
    gamesAsCreator: myGames.filter(g => g.isCreator).length,
    gamesAsPlayer: myGames.filter(g => !g.isCreator).length,
    totalWinnings: myGames
      .filter(g => g.status === "completed" && g.winner?.toLowerCase() === address?.toLowerCase())
      .reduce((sum, g) => sum + parseFloat(g.prizePool), 0)
      .toFixed(4)
  }

  // Get games where it's my turn
  const myTurnGames = myGames.filter(g => g.myTurn && g.status === "active")
  const hasUrgentActions = () => myTurnGames.length > 0

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
      case "active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "waiting": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      case "completed": return "bg-violet-500/20 text-violet-400 border-violet-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
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
    return mode === "Quick Draw" ? 
      <Target className="w-6 h-6 text-white" /> : 
      <Brain className="w-6 h-6 text-white" />
  }

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Time up!"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getUrgencyColor = (timeLeft: number) => {
    if (timeLeft <= 30) return "text-red-400"
    if (timeLeft <= 60) return "text-amber-400"
    return "text-slate-300"
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
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-6 py-2 mb-6">
            <span className="text-cyan-400 font-bold">MY GAMES (DIRECT HOOK)</span>
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
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${contractsReady ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-slate-400">
                {contractsReady ? 'Connected' : 'Connecting...'}
              </span>
            </div>
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-emerald-900/20 border-emerald-500/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{stats.activeGames}</div>
              <div className="text-sm text-emerald-300">Active Games</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{stats.waitingGames}</div>
              <div className="text-sm text-amber-300">Waiting</div>
            </CardContent>
          </Card>

          <Card className={`${myTurnGames.length > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}>
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 ${myTurnGames.length > 0 ? 'bg-red-500/20' : 'bg-blue-500/20'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Timer className={`w-6 h-6 ${myTurnGames.length > 0 ? 'text-red-400' : 'text-blue-400'}`} />
              </div>
              <div className={`text-2xl font-black ${myTurnGames.length > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {myTurnGames.length}
              </div>
              <div className={`text-sm ${myTurnGames.length > 0 ? 'text-red-300' : 'text-blue-300'}`}>
                My Turn
              </div>
            </CardContent>
          </Card>

          <Card className="bg-violet-900/20 border-violet-500/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-violet-400" />
              </div>
              <div className="text-2xl font-black text-violet-400">{stats.completedGames}</div>
              <div className="text-sm text-violet-300">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-cyan-900/20 border-cyan-500/30">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400">{stats.totalGames}</div>
              <div className="text-sm text-cyan-300">Total Games</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search by game ID or mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedFilter("all")}
              variant={selectedFilter === "all" ? "default" : "outline"}
              className="bg-cyan-600 hover:bg-cyan-700 border-cyan-500"
            >
              All ({stats.totalGames})
            </Button>
            <Button
              onClick={() => setSelectedFilter("my-turn")}
              variant={selectedFilter === "my-turn" ? "default" : "outline"}
              className={`${myTurnGames.length > 0 ? 'bg-red-600 hover:bg-red-700 border-red-500' : 'bg-blue-600 hover:bg-blue-700 border-blue-500'}`}
            >
              My Turn ({myTurnGames.length})
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

        {/* Games List */}
        {isLoading && myGames.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-xl font-bold text-white">Loading your games...</p>
              <p className="text-slate-400">Fetching directly from contract</p>
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
              <Card key={game.gameId} className={`bg-slate-800/60 backdrop-blur-sm border transition-colors ${
                game.myTurn && game.status === "active" 
                  ? 'border-red-500/50 hover:border-red-500/70' 
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${
                        game.mode === "Quick Draw" 
                          ? "from-emerald-400 to-teal-600" 
                          : "from-blue-400 to-indigo-600"
                      } rounded-xl flex items-center justify-center`}>
                        {getModeIcon(game.mode)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-black text-white">Battle #{game.gameId}</h3>
                          <Badge className={getStatusColor(game.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(game.status)}
                              <span>{game.status.toUpperCase()}</span>
                            </div>
                          </Badge>
                          {game.isCreator && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              <Crown className="w-3 h-3 mr-1" />
                              CREATOR
                            </Badge>
                          )}
                          {game.myTurn && game.status === "active" && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                              <Timer className="w-3 h-3 mr-1" />
                              YOUR TURN
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-slate-300 space-y-1">
                          <div className="flex items-center space-x-4">
                            <p><span className="font-semibold">Mode:</span> {game.mode}</p>
                            <p><span className="font-semibold">Players:</span> {game.players.length}/2</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <p><span className="font-semibold">Entry Fee:</span> {parseFloat(game.entryFee).toFixed(4)} ETH</p>
                            <p><span className="font-semibold">Prize Pool:</span> {parseFloat(game.prizePool).toFixed(4)} ETH</p>
                          </div>
                          {game.status === "active" && game.currentNumber && (
                            <p><span className="font-semibold">Current Number:</span> {game.currentNumber}</p>
                          )}
                          {game.status === "completed" && game.winner && (
                            <p><span className="font-semibold">Winner:</span> 
                              <span className={`ml-1 ${
                                game.winner.toLowerCase() === address?.toLowerCase() 
                                  ? 'text-emerald-400 font-bold' 
                                  : 'text-slate-400'
                              }`}>
                                {game.winner.toLowerCase() === address?.toLowerCase() 
                                  ? '🏆 You Won!' 
                                  : 'Opponent Won'
                                }
                              </span>
                            </p>
                          )}
                          {game.timeLeft > 0 && game.status === "active" && (
                            <p>
                              <span className="font-semibold">Time Left:</span> 
                              <span className={`ml-1 font-mono ${getUrgencyColor(game.timeLeft)}`}>
                                {formatTimeLeft(game.timeLeft)}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        onClick={() => navigateToGame(game.gameId)}
                        className={`${
                          game.myTurn && game.status === "active"
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                        } text-white rounded-lg min-w-[120px]`}>
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
                          <p className="text-xs text-amber-400">
                            {game.isCreator ? "Waiting for opponent..." : "Game starting soon..."}
                          </p>
                          {game.isCreator && (
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/battle/${game.gameId}`)
                                toast.success("Game link copied!")
                              }}
                              variant="outline"
                              size="sm"
                              className="mt-1 text-xs border-slate-600 text-slate-300"
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
                              +{parseFloat(game.prizePool).toFixed(4)} ETH
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
          <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Your Gaming Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{stats.gamesAsCreator}</div>
                <div className="text-sm text-slate-400">Games Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.gamesAsPlayer}</div>
                <div className="text-sm text-slate-400">Games Joined</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {stats.completedGames > 0 
                    ? Math.round((myGames.filter(g => g.status === "completed" && g.winner?.toLowerCase() === address?.toLowerCase()).length / stats.completedGames) * 100)
                    : 0
                  }%
                </div>
                <div className="text-sm text-slate-400">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-400">{stats.totalWinnings} ETH</div>
                <div className="text-sm text-slate-400">Total Winnings</div>
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
                <span className="text-slate-400">Provider Ready:</span>
                <span className={`ml-2 ${providerReady ? 'text-green-400' : 'text-red-400'}`}>
                  {providerReady ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Contracts Ready:</span>
                <span className={`ml-2 ${contractsReady ? 'text-green-400' : 'text-red-400'}`}>
                  {contractsReady ? 'Yes' : 'No'}
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