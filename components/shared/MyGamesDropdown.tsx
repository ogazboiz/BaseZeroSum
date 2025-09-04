"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Gamepad2, 
  Target, 
  Brain, 
  Clock, 
  Play, 
  Trophy, 
  AlertTriangle,
  ChevronDown,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useZeroSumData } from "@/hooks/useZeroSumContract"
import { toast } from "react-hot-toast"
import { formatEther } from "viem"

interface MyGame {
  gameId: number
  status: "waiting" | "active" | "completed"
  mode: "Quick Draw" | "Strategic"
  entryFee: string
  prizePool: string
  isCreator: boolean
  isPlayer: boolean
  currentPlayer: string
  myTurn: boolean
}

export default function MyGamesDropdown() {
  const { address, isConnected } = useAccount()
  const { getGameCounter, getGame, getPlayers, getPlayerView } = useZeroSumData()
  
  const [isOpen, setIsOpen] = useState(false)
  const [myGames, setMyGames] = useState<MyGame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalGames, setTotalGames] = useState(0)

  // Fetch user's games
  const fetchMyGames = async () => {
    if (!address || !isConnected) return
    
    try {
      setIsLoading(true)
      
      // Get total number of games
      const gameCount = await getGameCounter()
      setTotalGames(gameCount)
      
      const games: MyGame[] = []
      
      // Check last 50 games for user participation
      const startGame = Math.max(0, gameCount - 50)
      
      for (let i = startGame; i < gameCount; i++) {
        try {
          const gameData = await getGame(i)
          if (gameData) {
            const players = await getPlayers(i)
            
            // Check if user is in this game
            const isPlayer = players.includes(address)
            const isCreator = players[0] === address
            
            if (isPlayer) {
              // Get player view to check if it's user's turn
              const playerView = await getPlayerView(i)
              
              games.push({
                gameId: i,
                status: gameData.status === 0 ? "waiting" : 
                       gameData.status === 1 ? "active" : "completed",
                mode: gameData.mode === 0 ? "Quick Draw" : "Strategic",
                               entryFee: gameData.entryFee ? (typeof gameData.entryFee === 'bigint' ? formatEther(gameData.entryFee) : gameData.entryFee.toString()) : "0",
               prizePool: gameData.prizePool ? (typeof gameData.prizePool === 'bigint' ? formatEther(gameData.prizePool) : gameData.prizePool.toString()) : "0",
                isCreator,
                isPlayer,
                currentPlayer: gameData.currentPlayer,
                myTurn: playerView?.yourTurn || false
              })
            }
          }
        } catch (error) {
          // Skip games that can't be fetched
          continue
        }
      }
      
      setMyGames(games)
    } catch (error) {
      console.error("Failed to fetch my games:", error)
      toast.error("Failed to load your games")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && isConnected) {
      fetchMyGames()
      
      // Only fetch once when opening, not continuously
      // Remove the aggressive polling that was causing issues
    }
  }, [isOpen, isConnected, address])

  if (!isConnected) return null

  const activeGames = myGames.filter(g => g.status === "active")
  const waitingGames = myGames.filter(g => g.status === "waiting")
  const completedGames = myGames.filter(g => g.status === "completed")

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl font-bold bg-transparent"
      >
        <Gamepad2 className="w-5 h-5 mr-2" />
        MY GAMES
        {activeGames.length > 0 && (
          <Badge className="ml-2 bg-emerald-500 text-white text-xs">
            {activeGames.length}
          </Badge>
        )}
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black text-white flex items-center justify-between">
              <span>MY GAMES</span>
              <Button
                size="sm"
                onClick={fetchMyGames}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                <p className="text-slate-400">Loading your games...</p>
              </div>
            ) : myGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-slate-400 font-medium">No games found</p>
                <p className="text-slate-500 text-sm">Create or join a battle to get started!</p>
              </div>
            ) : (
              <>
                {/* Active Games */}
                {activeGames.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      ACTIVE GAMES ({activeGames.length})
                    </h4>
                    <div className="space-y-2">
                      {activeGames.map((game) => (
                        <Link
                          key={game.gameId}
                          href={`/battle/${game.gameId}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/30 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white">#{game.gameId}</span>
                              <Badge className="bg-emerald-500 text-white text-xs">
                                {game.myTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-300">
                              <p>{game.mode} • {game.entryFee} ETH</p>
                              <p className="text-emerald-400">
                                {game.isCreator ? "Creator" : "Player"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waiting Games */}
                {waitingGames.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      WAITING ({waitingGames.length})
                    </h4>
                    <div className="space-y-2">
                      {waitingGames.map((game) => (
                        <Link
                          key={game.gameId}
                          href={`/battle/${game.gameId}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg hover:bg-amber-900/30 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white">#{game.gameId}</span>
                              <Badge className="bg-amber-500 text-white text-xs">
                                WAITING
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-300">
                              <p>{game.mode} • {game.entryFee} ETH</p>
                              <p className="text-amber-400">
                                {game.isCreator ? "Waiting for opponent" : "Joined, waiting to start"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Games */}
                {completedGames.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-violet-400 mb-2 flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      COMPLETED ({completedGames.length})
                    </h4>
                    <div className="space-y-2">
                      {completedGames.slice(0, 3).map((game) => (
                        <Link
                          key={game.gameId}
                          href={`/battle/${game.gameId}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="p-3 bg-violet-900/20 border border-violet-500/30 rounded-lg hover:bg-violet-900/30 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white">#{game.gameId}</span>
                              <Badge className="bg-violet-500 text-white text-xs">
                                COMPLETED
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-300">
                              <p>{game.mode} • Prize: {game.prizePool} ETH</p>
                              <p className="text-violet-400">View results</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/create">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Create Battle
                      </Button>
                    </Link>
                    <Link href="/browse">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-slate-600 text-white hover:bg-slate-800/50 rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        <Gamepad2 className="w-4 h-4 mr-1" />
                        Browse Battles
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </div>
      )}
    </div>
  )
}
