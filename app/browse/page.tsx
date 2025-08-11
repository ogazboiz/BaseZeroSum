"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Gamepad2,
  Coins,
  Swords,
  Target,
  Brain,
  Eye,
  Zap,
  Loader2,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import {
  BattleFilters,
  BattleSearch,
  BattleCard,
  EmptyBattleState
} from "@/components/battle"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { useBrowseGames, type BattleData } from "@/hooks/useBrowseGames"
import { useZeroSumContract } from "@/hooks/useZeroSumContract"
import { toast } from "react-hot-toast"

export default function BrowseGamesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { joinGame, loading: contractLoading } = useZeroSumContract()
  const { battles, loading, filters, debugInfo, refetch } = useBrowseGames()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [joiningBattle, setJoiningBattle] = useState<number | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Filter battles based on search and selected filter
  const filteredBattles = battles.filter((battle) => {
    const matchesSearch =
      battle.mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battle.creator.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === "all") return matchesSearch
    return matchesSearch && battle.modeId === selectedFilter
  })

  // Handle joining a battle
  const handleJoinBattle = async (battleId: number, modeId: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to join a battle!")
      return
    }

    const battle = battles.find(b => b.id === battleId)
    if (!battle) {
      toast.error("Battle not found!")
      return
    }

    setJoiningBattle(battleId)
    
    try {
      console.log(`🎮 Attempting to join game ${battleId} with entry fee ${battle.entryFee} ETH`)
      const result = await joinGame(battleId, battle.entryFee)
      
      if (result.success) {
        toast.success("Successfully joined the battle!")
        // Check if the battle is full (2 players) or still waiting
        // For now, redirect to battle page - in real app you'd check game state
        router.push(`/battle/${battleId}`)
      }
    } catch (error: any) {
      console.error('Error joining battle:', error)
    } finally {
      setJoiningBattle(null)
    }
  }

  // Handle watching a battle
  const handleWatchBattle = (battleId: number, modeId: string) => {
    router.push(`/spectate/${battleId}?mode=${modeId}`)
  }

  // Handle creating a new battle
  const handleCreateBattle = () => {
    router.push("/create")
  }

  // Handle manual refresh
  const handleRefresh = () => {
    refetch()
    toast.success("Refreshing battles...")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Gaming Navigation */}
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
          
          {/* Connection Status */}
          {!isConnected && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-amber-400 font-medium">
                ⚠️ Connect your wallet to join battles
              </p>
            </div>
          )}
        </div>

        {/* Debug Info - Show when no battles found */}
        {!loading && battles.length === 0 && debugInfo && (
          <div className="mb-8 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white">🔍 Debug Information</h3>
              <Button
                onClick={() => setShowDebug(!showDebug)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                {showDebug ? "Hide" : "Show"} Details
              </Button>
            </div>
            
            <div className="text-sm text-slate-300 space-y-2">
              <p>📊 Total Games on Contract: <span className="text-cyan-400 font-bold">{debugInfo.gameCounter || 0}</span></p>
              <p>🔍 Games Checked: <span className="text-emerald-400 font-bold">{debugInfo.gamesChecked?.length || 0}</span></p>
              <p>✅ Games Filtered: <span className="text-blue-400 font-bold">{debugInfo.gamesFiltered?.length || 0}</span></p>
              
              {showDebug && debugInfo.gamesChecked && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-700">
                  <h4 className="font-bold mb-2">Game Analysis:</h4>
                  <div className="space-y-2 text-xs">
                    {debugInfo.gamesChecked.map((game: any, index: number) => (
                      <div key={index} className="p-2 bg-slate-800/50 rounded">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">Game {game.id}:</span>
                          <span className={game.reason === 'PASSED - Should be included' ? 'text-green-400' : 'text-red-400'}>
                            {game.reason}
                          </span>
                        </div>
                        <div className="text-slate-400 space-y-1">
                          <div>Status: {game.status} | Players: {game.playersCount} | Bettable: {game.bettable ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {debugInfo.detailedAnalysis && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-600">
                      <h4 className="font-bold mb-2 text-yellow-400">Detailed Analysis:</h4>
                      <div className="space-y-2 text-xs">
                        {debugInfo.detailedAnalysis.map((analysis: any, index: number) => (
                          <div key={index} className="p-2 bg-slate-900/50 rounded">
                            <div className="font-bold text-white">Game {analysis.gameId}:</div>
                            <div className="text-slate-300 space-y-1 mt-1">
                              <div>Status: <span className="text-blue-400">{analysis.gameStatus} ({analysis.gameStatusName})</span></div>
                              <div>Players: <span className="text-green-400">{analysis.playersCount}</span></div>
                              <div>Bettable: <span className="text-purple-400">{analysis.bettable ? 'Yes' : 'No'}</span></div>
                              <div>Entry Fee: <span className="text-cyan-400">{analysis.entryFee}</span></div>
                              <div>Prize Pool: <span className="text-emerald-400">{analysis.prizePool}</span></div>
                              <div className={`font-bold ${analysis.shouldInclude ? 'text-green-400' : 'text-red-400'}`}>
                                Result: {analysis.excludeReason}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search, Filters, and Refresh */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <BattleSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <BattleFilters 
            filters={filters} 
            selectedFilter={selectedFilter} 
            onFilterSelect={setSelectedFilter} 
          />
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-xl text-slate-300">Loading battles from blockchain...</p>
            <p className="text-sm text-slate-400 mt-2">
              Fetching game data from Sepolia testnet...
            </p>
          </div>
        )}

        {/* Battles Grid */}
        {!loading && filteredBattles.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBattles.map((battleData) => (
              <BattleCard
                key={battleData.id}
                battle={battleData} // Pass BattleData directly
                onJoinBattle={handleJoinBattle}
                onWatchBattle={handleWatchBattle}
                isJoining={joiningBattle === battleData.id}
                isConnected={isConnected}
                currentUserAddress={address}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBattles.length === 0 && (
          <div className="text-center py-12">
            {battles.length === 0 ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Swords className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Active Battles Found</h3>
                  <p className="text-slate-400 mb-6">
                    {debugInfo?.gameCounter > 0 
                      ? "Games exist on contract but may be full or finished. Check debug info above."
                      : "Be the first warrior to create a battle!"
                    }
                  </p>
                  <Button
                    onClick={handleCreateBattle}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    CREATE BATTLE
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="w-12 h-12 text-slate-400" />
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
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={handleCreateBattle}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      CREATE BATTLE
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && battles.length > 0 && (
          <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{battles.length}</div>
                <div className="text-sm text-slate-400">Active Battles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {filters.find(f => f.id === "quick-draw")?.count || 0}
                </div>
                <div className="text-sm text-slate-400">Quick Draw</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {filters.find(f => f.id === "strategic")?.count || 0}
                </div>
                <div className="text-sm text-slate-400">Strategic</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {battles.reduce((total, battle) => total + parseFloat(battle.prizePool), 0).toFixed(4)} ETH
                </div>
                <div className="text-sm text-slate-400">Total Prize Pool</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}