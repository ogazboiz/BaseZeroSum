"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Coins,
  Trophy,
  X,
  Eye,
  TrendingUp,
  Clock,
  Wallet,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useSpectatorData, GameContract } from "@/hooks/useSpectatorContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { toast } from "react-hot-toast"

interface Bet {
  gameId: number
  gameContract: string
  amount: string
  predictedWinner: string
  claimed: boolean
  timestamp: number
  status?: "active" | "won" | "lost" | "pending"
  gameStatus?: "waiting" | "active" | "completed"
}

export default function MyBetsPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [bets, setBets] = useState<Bet[]>([])
  const [filteredBets, setFilteredBets] = useState<Bet[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "won" | "lost" | "pending">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ✅ NEW: Smart contract hooks
  const {
    getUserBettingHistoryDetailed,
    getBettingInfo,
    isBettingAllowed
  } = useSpectatorData()

  // ✅ NEW: Manual refresh function to prevent loops
  const handleManualRefresh = useCallback(async () => {
    if (!address || !isConnected) return
    
    try {
      setIsRefreshing(true)
      console.log('🔄 Manual refresh triggered...')
      
      // Get fresh data from contract
      const zeroSumBets = await getUserBettingHistoryDetailed(address, 50)
      
      // Process bets - note: contract returns address(0) for gameContracts and 0 for gameIds
      const allBets: Bet[] = []
      
      zeroSumBets.gameKeys.forEach((gameKey, index) => {
        if (gameKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Generate a game ID from the gameKey hash
          const gameId = parseInt(gameKey.slice(2, 10), 16) || index + 1
          
          allBets.push({
            gameId,
            gameContract: "ZeroSum Simplified", // Default assumption since contract doesn't return this
            amount: zeroSumBets.amounts[index],
            predictedWinner: zeroSumBets.predictedWinners[index],
            claimed: zeroSumBets.claimed[index],
            timestamp: zeroSumBets.timestamps[index],
            status: zeroSumBets.claimed[index] ? "won" : "pending",
            gameStatus: "completed"
          })
        }
      })
      
      // Sort and update
      const sortedBets = allBets.sort((a, b) => b.timestamp - a.timestamp)
      setBets(sortedBets)
      setFilteredBets(sortedBets)
      console.log('✅ Manual refresh completed:', sortedBets)
      
    } catch (error) {
      console.error('Manual refresh failed:', error)
      toast.error("Failed to refresh betting data")
    } finally {
      setIsRefreshing(false)
    }
  }, [address, isConnected, getUserBettingHistoryDetailed])

  // ✅ NEW: Fetch real betting history from smart contract
  const fetchBetsFromContract = useCallback(async () => {
    if (!address || !isConnected) return

    try {
      setIsRefreshing(true)
      console.log('🔍 Fetching betting history from smart contract...')
      
      // Get detailed betting history from ZeroSum games only (since both calls were the same)
      const zeroSumBets = await getUserBettingHistoryDetailed(address, 50)
      
      // Process and combine bets
      const allBets: Bet[] = []
      
      // Process ZeroSum bets - note: contract returns address(0) for gameContracts and 0 for gameIds
      // We'll use the gameKey to generate a unique identifier and assume ZeroSum games
      zeroSumBets.gameKeys.forEach((gameKey, index) => {
        if (gameKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Generate a game ID from the gameKey hash
          const gameId = parseInt(gameKey.slice(2, 10), 16) || index + 1
          
          allBets.push({
            gameId,
            gameContract: "ZeroSum Simplified", // Default assumption since contract doesn't return this
            amount: zeroSumBets.amounts[index],
            predictedWinner: zeroSumBets.predictedWinners[index],
            claimed: zeroSumBets.claimed[index],
            timestamp: zeroSumBets.timestamps[index],
            status: zeroSumBets.claimed[index] ? "won" : "pending",
            gameStatus: "completed" // Assuming if claimed, game is completed
          })
        }
      })
      
      // Sort by most recent first
      const sortedBets = allBets.sort((a, b) => b.timestamp - a.timestamp)
      setBets(sortedBets)
      setFilteredBets(sortedBets)
      console.log('📚 Fetched bets from contract:', sortedBets)
      
    } catch (error) {
      console.error('Failed to fetch bets from contract:', error)
      // Fallback to localStorage if contract fails
      fetchBetsFromLocalStorage()
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [address, isConnected, getUserBettingHistoryDetailed])

  // ✅ NEW: Fallback to localStorage if contract fails
  const fetchBetsFromLocalStorage = useCallback(() => {
    if (!address) return

    const allBets: Bet[] = []
    
    // Scan localStorage for all bets by this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('bet_') && key.includes(address)) {
        try {
          const betData = JSON.parse(localStorage.getItem(key) || '{}')
          const gameId = parseInt(key.split('_')[1])
          
          if (!isNaN(gameId)) {
            allBets.push({
              gameId,
              gameContract: "ZeroSum Simplified", // Default assumption
              amount: betData.amount,
              predictedWinner: betData.player || betData.predictedWinner,
              claimed: betData.claimed || false,
              timestamp: betData.timestamp || Date.now(),
              status: betData.claimed ? "won" : "pending",
              gameStatus: "active"
            })
          }
        } catch (error) {
          console.error('Failed to parse bet data:', error)
        }
      }
    }
    
    // Sort by most recent first
    const sortedBets = allBets.sort((a, b) => b.timestamp - a.timestamp)
    setBets(sortedBets)
    setFilteredBets(sortedBets)
    console.log('📚 Fetched bets from localStorage (fallback):', sortedBets)
  }, [address])

  // ✅ NEW: Auto-fetch bets when component mounts
  useEffect(() => {
    if (isConnected && address) {
      fetchBetsFromContract()
    } else {
      setIsLoading(false)
    }
  }, [isConnected, address]) // Removed fetchBetsFromContract from dependencies to prevent loops

  // ✅ NEW: Debounced search to prevent too many filter operations
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // ✅ NEW: Optimized filtering with debounced search
  useEffect(() => {
    let filtered = bets

    // Filter by debounced search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(bet => 
        bet.gameId.toString().includes(debouncedSearchTerm) || 
        bet.predictedWinner.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(bet => bet.status === statusFilter)
    }

    setFilteredBets(filtered)
  }, [bets, debouncedSearchTerm, statusFilter])

  // Calculate statistics
  const totalBets = bets.length
  const activeBets = bets.filter(bet => bet.status === "active").length
  const wonBets = bets.filter(bet => bet.status === "won").length
  const lostBets = bets.filter(bet => bet.status === "lost").length
  const totalAmount = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <UnifiedGamingNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400">Please connect your wallet to view your betting history</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <UnifiedGamingNavigation />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Bets</h1>
            <p className="text-slate-400">Track all your betting activity across all games</p>
            {/* ✅ NEW: Contract limitation notice */}
            {/* <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Note: Contract returns limited game details. Game IDs are estimated from blockchain data.
            </p> */}
          </div>
          
          {/* ✅ NEW: Refresh Button */}
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold"
          >
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh from Contract"}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-white">{totalBets}</div>
              <div className="text-xs text-slate-400">Total Bets</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-blue-400">{activeBets}</div>
              <div className="text-xs text-blue-400">Active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{wonBets}</div>
              <div className="text-xs text-emerald-400">Won</div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/10 backdrop-blur-sm border border-red-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-red-400">{lostBets}</div>
              <div className="text-xs text-red-400">Lost</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-purple-400">{totalAmount.toFixed(2)}</div>
              <div className="text-xs text-purple-400">Total MNT</div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ NEW: Betting Summary Cards */}
        {bets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-emerald-500/10 border border-emerald-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{bets.length}</div>
                <div className="text-sm text-emerald-300">Total Bets</div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-500/10 border border-blue-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toFixed(4)}
                </div>
                <div className="text-sm text-blue-300">Total Amount (MNT)</div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-500/10 border border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {bets.filter(bet => bet.status === "pending").length}
                </div>
                <div className="text-sm text-yellow-300">Pending Bets</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-500/10 border border-purple-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {bets.filter(bet => bet.status === "won").length}
                </div>
                <div className="text-sm text-purple-300">Won Bets</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ✅ NEW: Debug Panel for Contract Data */}
        {/* {process.env.NODE_ENV === 'development' && bets.length > 0 && (
          <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 mb-6">
            <CardHeader>
              <CardTitle className="text-yellow-400">🔧 Debug: Contract Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-300 font-mono">
                <p>📊 Raw Contract Data:</p>
                <p>• Total Bets Found: {bets.length}</p>
                <p>• First Bet Game ID: {bets[0]?.gameId}</p>
                <p>• First Bet Amount: {bets[0]?.amount} MNT</p>
                <p>• First Bet Predicted Winner: {bets[0]?.predictedWinner?.slice(0, 10)}...</p>
                <p>• First Bet Timestamp: {bets[0]?.timestamp}</p>
                <p>• First Bet Status: {bets[0]?.status}</p>
                <p className="text-yellow-400 mt-2">
                  💡 Note: Game IDs are estimated from blockchain hashes since contract doesn't return them directly.
                </p>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Filters and Search */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by game ID or player address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600/50 text-white"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="border-slate-600 text-white hover:bg-slate-800/50"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className="border-blue-600 text-blue-400 hover:bg-blue-500/10"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "won" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("won")}
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10"
                >
                  Won
                </Button>
                <Button
                  variant={statusFilter === "lost" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("lost")}
                  className="border-red-600 text-red-400 hover:bg-red-500/10"
                >
                  Lost
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin" />
            <p className="text-slate-400">Loading your betting history...</p>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="text-center py-12">
            {bets.length === 0 ? (
              <div>
                <Coins className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No Bets Found</h3>
                <p className="text-slate-500 mb-4">
                  {isConnected 
                    ? "You haven't placed any bets yet. Start betting on games to see them here!"
                    : "Connect your wallet to view your betting history."
                  }
                </p>
                {isConnected && (
                  <Button
                    onClick={() => router.push("/browse")}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Games to Bet On
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No Bets Match Your Filters</h3>
                <p className="text-slate-500">Try adjusting your search terms or status filters.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBets.map((bet, index) => (
              <Card key={index} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        bet.status === "won" ? "bg-emerald-500/20" :
                        bet.status === "lost" ? "bg-red-500/20" :
                        bet.status === "pending" ? "bg-yellow-500/20" :
                        "bg-blue-500/20"
                      }`}>
                        {bet.status === "won" ? (
                          <Trophy className="w-6 h-6 text-emerald-400" />
                        ) : bet.status === "lost" ? (
                          <X className="w-6 h-6 text-red-400" />
                        ) : bet.status === "pending" ? (
                          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                        ) : (
                          <Clock className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      
                      {/* Bet Info */}
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-white">Game #{bet.gameId}</h3>
                          <Badge className={
                            bet.status === "won" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                            bet.status === "lost" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            bet.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                            "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }>
                            {bet.status === "won" ? "WON" : 
                             bet.status === "lost" ? "LOST" : 
                             bet.status === "pending" ? "PENDING" : "ACTIVE"}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Game Contract: {bet.gameContract}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Predicted Winner: {bet.predictedWinner.slice(0, 8)}...{bet.predictedWinner.slice(-6)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Placed: {new Date(bet.timestamp * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right Side - Amount and Actions */}
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400 mb-3">
                        {bet.amount} MNT
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => router.push(`/battle/${bet.gameId}`)}
                          variant="outline"
                          size="sm"
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Game
                        </Button>
                        
                        {bet.status === "won" && !bet.claimed && (
                          <Button
                            onClick={() => router.push(`/battle/${bet.gameId}`)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Claim Winnings
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

