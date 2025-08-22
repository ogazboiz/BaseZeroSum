"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Gamepad2,
  Trophy,
  Users,
  Coins,
  Clock,
  Calendar,
  Target,
  Brain,
  Eye,
  Zap,
  Crown,
  Award,
  Bot,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { useUnifiedGameContract, useUnifiedGameData, UnifiedGameMode, TournamentStatus, getModeName, getModeIcon, TournamentGame } from "@/hooks/useUnifiedGameContracts"
import { useAccount } from "wagmi"
import { toast } from "react-hot-toast"

export default function TournamentsPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [selectedTab, setSelectedTab] = useState("active")
  
  // Use the unified hooks
  const { loading, joinTournament, recordMatchResult, createGame, joinGame } = useUnifiedGameContract()
  const { getActiveTournaments, getCompletedTournaments, hasUserJoinedTournament, getTournamentBracket, getTournamentStats, isTournamentAdmin, checkForExistingTournamentGame } = useUnifiedGameData()
  
  // State for tournaments
  const [activeTournaments, setActiveTournaments] = useState<TournamentGame[]>([])
  const [upcomingTournaments, setUpcomingTournaments] = useState<TournamentGame[]>([])
  const [completedTournaments, setCompletedTournaments] = useState<TournamentGame[]>([])
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true)
  const [userParticipations, setUserParticipations] = useState<Set<number>>(new Set())
  const [selectedTournament, setSelectedTournament] = useState<TournamentGame | null>(null)
  const [tournamentBracket, setTournamentBracket] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [matchGames, setMatchGames] = useState<Map<string, number>>(new Map()) // Track games per match

  // Load tournaments on component mount
  useEffect(() => {
    loadTournaments()
  }, [address])

  // Check if user is admin (tournament contract owner)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!address) {
        setIsAdmin(false)
        return
      }

      try {
        const adminStatus = await isTournamentAdmin(address)
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [address, isTournamentAdmin])

  const loadTournaments = async () => {
    try {
      setIsLoadingTournaments(true)
      
      // Show loading progress with timeout
      const loadingToast = toast.loading('Loading tournaments...', { id: 'tournaments' })
      
      // Set a timeout to show progress
      setTimeout(() => {
        if (isLoadingTournaments) {
          toast.loading('Still loading tournaments... This may take a moment on first load.', { id: 'tournaments' })
        }
      }, 3000)
      
      // Load all tournament types in parallel for better performance
      const [activeAndUpcoming, completed] = await Promise.all([
        getActiveTournaments(),
        getCompletedTournaments()
      ])
      
      // Separate tournaments by status and fill state
      const active = activeAndUpcoming.filter(t => t.status === TournamentStatus.ACTIVE)
      const upcoming = activeAndUpcoming.filter(t => 
        t.status === TournamentStatus.REG && t.currentParticipants < t.maxParticipants
      )
      const filled = activeAndUpcoming.filter(t => 
        t.status === TournamentStatus.REG && t.currentParticipants >= t.maxParticipants
      )
      
      setActiveTournaments(active)
      setUpcomingTournaments([...upcoming, ...filled]) // Include filled tournaments in upcoming
      setCompletedTournaments(completed)

      // Check user participations if wallet is connected
      if (address) {
        const participations = new Set<number>()
        for (const tournament of activeAndUpcoming) {
          if (tournament.participants && tournament.participants.includes(address)) {
            participations.add(tournament.id)
          }
        }
        setUserParticipations(participations)
      }

      // Success message
      toast.success(`Loaded ${activeAndUpcoming.length + completed.length} tournaments`, { id: 'tournaments' })
      
    } catch (error) {
      console.error('Error loading tournaments:', error)
      toast.error('Failed to load tournaments', { id: 'tournaments' })
    } finally {
      setIsLoadingTournaments(false)
    }
  }

  const handleJoinTournament = async (tournament: TournamentGame) => {
    if (!address) {
      toast.error('Please connect your wallet to join tournaments')
      return
    }

    // Check if user has already joined
    if (userParticipations.has(tournament.id)) {
      toast.error('You have already joined this tournament!')
      return
    }

    try {
      await joinTournament(tournament.id, tournament.entryFee)
      toast.success('Successfully joined tournament!')
      
      // Update local participation state
      setUserParticipations(prev => new Set([...prev, tournament.id]))
      
      // Reload tournaments to update participant count
      await loadTournaments()
    } catch (error) {
      console.error('Error joining tournament:', error)
      // Error is already handled by the hook
    }
  }

  const handleWatchTournament = (tournamentId: number) => {
    router.push(`/tournaments/${tournamentId}/watch`)
  }

  const handleCreateTournament = () => {
    router.push("/tournaments/create")
  }

  const handleSetReminder = (tournamentId: number) => {
    toast.success(`Reminder set for tournament ${tournamentId}`)
  }

  const handleViewResults = (tournamentId: number) => {
    router.push(`/tournaments/${tournamentId}/results`)
  }

  // Tournament gameplay functions
  const handleViewTournament = async (tournament: TournamentGame) => {
    setSelectedTournament(tournament)
    try {
      const bracket = await getTournamentBracket(tournament.id)
      setTournamentBracket(bracket)
      
      if (address) {
        const stats = await getTournamentStats(address)
        setUserStats(stats)
      }
    } catch (error) {
      console.error('Error loading tournament bracket:', error)
      toast.error('Failed to load tournament bracket')
    }
  }

  // Start playing a specific match
  const handlePlayMatch = async (tournamentId: number, round: number, matchIndex: number, player1: string, player2: string) => {
    // Navigate to the actual game interface
    // For now, we'll show a modal with game options
    router.push(`/battle/${tournamentId}/${round}/${matchIndex}`)
  }

  // Quick play function for tournament matches
  const handleQuickPlay = async (tournamentId: number, round: number, matchIndex: number) => {
    try {
      if (!selectedTournament) return
      
      // Create a unique key for this match
      const matchKey = `${tournamentId}-${round}-${matchIndex}`
      
      // Check if a game already exists for this match
      let gameId: number | undefined = matchGames.get(matchKey)
      
      if (!gameId) {
        // No game exists yet - create a new one
        toast.loading('Creating tournament match...', { id: 'tournament-game' })
        
        const game = await createGame(selectedTournament.mode, selectedTournament.entryFee)
        
        if (game.success) {
          gameId = Number(game.gameId)
          
          // Store the game ID for this match
          setMatchGames(prev => new Map(prev).set(matchKey, gameId!))
          
          toast.success(`Tournament match created! Game ID: ${gameId}`, { id: 'tournament-game' })
        } else {
          toast.error('Failed to create tournament match', { id: 'tournament-game' })
          return
        }
      } else {
        // Game already exists - join it
        toast.loading('Joining existing tournament match...', { id: 'tournament-game' })
        
        try {
          await joinGame(gameId, selectedTournament.mode, selectedTournament.entryFee)
          toast.success(`Joined tournament match! Game ID: ${gameId}`, { id: 'tournament-game' })
        } catch (error) {
          console.error('Error joining game:', error)
          toast.error('Failed to join existing match', { id: 'tournament-game' })
          return
        }
      }
      
      // Ensure we have a valid game ID before routing
      if (gameId) {
        // Route to correct battle interface based on game mode
        let battleRoute = `/battle/${gameId}`
        
        // Hardcore games go to /battle/hardcore/[id]
        if (selectedTournament.mode === UnifiedGameMode.HARDCORE_MYSTERY || 
            selectedTournament.mode === UnifiedGameMode.LAST_STAND) {
          battleRoute = `/battle/hardcore/${gameId}`
        }
        
        router.push(battleRoute)
      } else {
        toast.error('Failed to get game ID for tournament match')
      }
      
    } catch (error) {
      console.error('Error starting match:', error)
      toast.error('Failed to start match')
    }
  }

  const handleRecordMatchResult = async (
    tournamentId: number,
    round: number,
    matchIndex: number,
    winner: string
  ) => {
    try {
      await recordMatchResult(tournamentId, round, matchIndex, winner)
      // Refresh the bracket
      if (selectedTournament) {
        const bracket = await getTournamentBracket(selectedTournament.id)
        setTournamentBracket(bracket)
      }
    } catch (error) {
      console.error('Error recording match result:', error)
    }
  }

  const closeTournamentView = () => {
    setSelectedTournament(null)
    setTournamentBracket(null)
    setUserStats(null)
  }

  // Helper function to get tournament status display
  const getTournamentStatusDisplay = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.REG:
        return { text: "Filling", color: "bg-yellow-100 text-yellow-700 border-yellow-200" }
      case TournamentStatus.ACTIVE:
        return { text: "Active", color: "bg-green-100 text-green-700 border-green-200" }
      case TournamentStatus.FINISHED:
        return { text: "Completed", color: "bg-blue-100 text-blue-700 border-blue-200" }
      case TournamentStatus.CANCELLED:
        return { text: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" }
      default:
        return { text: "Unknown", color: "bg-gray-100 text-gray-700 border-gray-200" }
    }
  }

  // Helper function to get game mode icon
  const getGameModeIcon = (mode: UnifiedGameMode) => {
    switch (mode) {
      case UnifiedGameMode.QUICK_DRAW:
        return Target
      case UnifiedGameMode.STRATEGIC:
        return Brain
      case UnifiedGameMode.HARDCORE_MYSTERY:
        return Zap
      case UnifiedGameMode.LAST_STAND:
        return Users
      default:
        return Gamepad2
    }
  }

  // Helper function to get game mode color
  const getGameModeColor = (mode: UnifiedGameMode) => {
    switch (mode) {
      case UnifiedGameMode.QUICK_DRAW:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case UnifiedGameMode.STRATEGIC:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case UnifiedGameMode.HARDCORE_MYSTERY:
        return "bg-rose-500/20 text-rose-400 border-rose-500/30"
      case UnifiedGameMode.LAST_STAND:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Calculate tournament stats
  const totalActiveTournaments = activeTournaments.length + upcomingTournaments.length
  const totalCompletedTournaments = completedTournaments.length
  const totalPrizePools = [...activeTournaments, ...upcomingTournaments].reduce((sum, t) => sum + parseFloat(t.prizePool), 0)
  const totalPlayers = [...activeTournaments, ...upcomingTournaments].reduce((sum, t) => sum + t.currentParticipants, 0)

  return (
    <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      {/* Navigation */}
      <UnifiedGamingNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tournaments</h1>
          <p className="text-xl text-slate-300">Compete in bracket-style competitions for bigger prizes</p>
          <div className="mt-4 flex gap-2 justify-center">
            <Button
              onClick={loadTournaments}
              disabled={isLoadingTournaments}
              variant="outline"
              size="sm"
              className="bg-slate-800/60 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              {isLoadingTournaments ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
                )}
            </Button>
            
            {/* Debug Button - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing optimized loading...')
                    const startTime = Date.now()
                    
                    const active = await getActiveTournaments()
                    const completed = await getCompletedTournaments()
                    
                    const endTime = Date.now()
                    const duration = endTime - startTime
                    
                    console.log(`⏱️ Loading took ${duration}ms`)
                    console.log(`📊 Results: ${active.length} active, ${completed.length} completed`)
                    
                    toast.success(`✅ Loaded in ${duration}ms: ${active.length + completed.length} tournaments`)
                  } catch (error) {
                    console.error('🧪 Test failed:', error)
                    toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Test Loading
              </Button>
            )}
          </div>
        </div>

        {/* Live Tournaments Banner */}
        <div className="relative mb-8">
          <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Tournaments Are Live!</h2>
            <p className="text-slate-300 mb-4">
              Join active tournaments for Quick Draw, Strategic, and Hardcore Mystery games. Compete for prizes and climb the leaderboards!
            </p>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400">Join Now</span>
            </div>
          </div>
        </div>

        {/* User's Joined Tournaments */}
        {address && userParticipations.size > 0 && (
          <Card className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/30 shadow-2xl rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-white">Your Tournaments</h3>
                    <p className="text-slate-300 text-sm">
                      You have joined {userParticipations.size} tournament{userParticipations.size !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {userParticipations.size} Joined
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...userParticipations].map((tournamentId) => {
                  const tournament = [...activeTournaments, ...upcomingTournaments].find(t => t.id === tournamentId)
                  if (!tournament) return null
                  
                  return (
                    <div key={tournamentId} className="flex items-center space-x-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tournament.name}
                        </p>
                        <p className="text-xs text-emerald-300">
                          {getModeName(tournament.mode)} • {tournament.entryFee} MNT
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs border-emerald-500/30 text-emerald-400"
                      >
                        {tournament.status === TournamentStatus.ACTIVE ? 'Active' : 'Filling'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Tournament Analytics Coming Soon */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-bold text-white">AI Tournament Analytics</h3>
                  <p className="text-slate-300 text-sm">
                    Get AI-powered tournament performance analysis and strategic insights
                  </p>
                </div>
              </div>
              <Badge className="bg-purple-200 text-purple-800 border-purple-300">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Tournaments", value: isLoadingTournaments ? "..." : totalActiveTournaments.toString(), icon: Trophy, color: "text-yellow-600" },
            { label: "Total Players", value: isLoadingTournaments ? "..." : totalPlayers.toString(), icon: Users, color: "text-blue-600" },
            { label: "Prize Pools", value: isLoadingTournaments ? "..." : `${totalPrizePools.toFixed(2)} MNT`, icon: Coins, color: "text-green-600" },
            { label: address ? `Your Tournaments` : "This Week", value: isLoadingTournaments ? "..." : (address ? userParticipations.size.toString() : `${totalCompletedTournaments} Completed`), icon: address ? Users : Calendar, color: address ? "text-emerald-600" : "text-purple-600" },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
            >
              <CardContent className="p-6 text-center">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-white">
                  {isLoadingTournaments && stat.value === "..." ? (
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Skeleton for Tournaments */}
        {isLoadingTournaments && (
          <div className="space-y-8">
            {/* Active Tournaments Skeleton */}
            <div>
              <div className="h-8 bg-slate-700/50 rounded-lg w-64 mb-6 animate-pulse"></div>
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tournaments Skeleton */}
            <div>
              <div className="h-8 bg-slate-700/50 rounded-lg w-64 mb-6 animate-pulse"></div>
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tournament Tabs */}
        <div className="flex space-x-1 bg-white/50 p-1 rounded-2xl mb-8 w-fit mx-auto">
          {[
            { id: "active", label: "Active & Upcoming", count: totalActiveTournaments },
            { id: "completed", label: "Completed", count: totalCompletedTournaments },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "default" : "ghost"}
              onClick={() => setSelectedTab(tab.id)}
              className="rounded-xl px-6"
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoadingTournaments && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading tournaments...</p>
          </div>
        )}

        {/* Active & Upcoming Tournaments */}
        {!isLoadingTournaments && selectedTab === "active" && (
          <div className="space-y-8">
            {/* Active Tournaments */}
            {activeTournaments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
                  Active Tournaments
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTournaments.map((tournament) => {
                    const statusDisplay = getTournamentStatusDisplay(tournament.status)
                    const modeIcon = getGameModeIcon(tournament.mode)
                    const modeColor = getGameModeColor(tournament.mode)
                    const timeLeft = Math.max(0, tournament.timeLeft)
                    
                    return (
                      <Card
                        key={tournament.id}
                        className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div
                              className={`w-12 h-12 ${modeColor} rounded-xl flex items-center justify-center mb-3`}
                            >
                              {React.createElement(modeIcon, { className: "w-6 h-6" })}
                            </div>
                            <Badge className={statusDisplay.color}>
                              {statusDisplay.text}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg font-bold text-white">{tournament.name}</CardTitle>
                          <p className="text-sm text-slate-300">{getModeName(tournament.mode)} Tournament</p>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-slate-400">Entry Fee</p>
                              <p className="font-bold text-white">{tournament.entryFee} MNT</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-400">Prize Pool</p>
                              <p className="font-bold text-green-600">{tournament.prizePool} MNT</p>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>
                                Players: {tournament.currentParticipants}/{tournament.maxParticipants}
                              </span>
                              <span>{timeLeft > 0 ? `${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m` : 'Live'}</span>
                            </div>
                            <Progress value={(tournament.currentParticipants / tournament.maxParticipants) * 100} className="h-2" />
                          </div>

                                                     <div className="flex items-center justify-between">
                             <Badge variant="outline" className="text-xs">
                               Round {tournament.currentRound}/{tournament.totalRounds}
                             </Badge>
                             <div className="flex space-x-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleViewTournament(tournament)}
                                 className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                               >
                                 <Eye className="w-3 h-3 mr-1" />
                                 View
                               </Button>
                               {userParticipations.has(tournament.id) ? (
                                 <Badge className="bg-green-100 text-green-700 border-green-200">
                                   <Users className="w-3 h-3 mr-1" />
                                   Joined
                                 </Badge>
                               ) : (
                                 <Button
                                   size="sm"
                                   onClick={() => handleJoinTournament(tournament)}
                                   disabled={loading || tournament.currentParticipants >= tournament.maxParticipants}
                                   className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                                 >
                                   <Users className="w-4 h-4 mr-1" />
                                   {tournament.currentParticipants >= tournament.maxParticipants ? 'Full' : 'Join Now'}
                                 </Button>
                               )}
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Tournaments */}
            {upcomingTournaments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                  Upcoming Tournaments
                </h2>
                <p className="text-slate-300 mb-6 text-center">
                  Join tournaments that are filling up, or watch filled tournaments that are ready to start. 
                  <br />
                  <span className="text-sm text-slate-400">
                    💡 When a tournament fills up, it automatically starts and moves to "Active Tournaments"
                  </span>
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {upcomingTournaments.map((tournament) => {
                    const modeIcon = getGameModeIcon(tournament.mode)
                    const modeColor = getGameModeColor(tournament.mode)
                    const timeLeft = Math.max(0, tournament.timeLeft)
                    const isFilled = tournament.currentParticipants >= tournament.maxParticipants
                    
                    return (
                      <Card
                        key={tournament.id}
                        className={`bg-slate-800/60 backdrop-blur-sm border shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl ${
                          isFilled ? 'border-orange-500/30' : 'border-slate-700/50'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 ${modeColor} rounded-xl flex items-center justify-center`}>
                              {React.createElement(modeIcon, { className: "w-6 h-6" })}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-lg text-white">{tournament.name}</h3>
                                {isFilled && (
                                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                    <Users className="w-3 h-3 mr-1" />
                                    Filled
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-300 mb-3">{getModeName(tournament.mode)} Tournament</p>

                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-slate-400">Players</p>
                                  <p className="font-medium text-white">{tournament.maxParticipants}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400">Entry Fee</p>
                                  <p className="font-medium text-white">{tournament.entryFee} MNT</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400">Est. Prize</p>
                                  <p className="font-medium text-green-600">{tournament.prizePool} MNT</p>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-slate-400">
                                    Players: {tournament.currentParticipants}/{tournament.maxParticipants}
                                  </span>
                                  <span className="text-slate-400">
                                    {isFilled ? 'Ready to Start' : 'Filling Up'}
                                  </span>
                                </div>
                                <Progress 
                                  value={(tournament.currentParticipants / tournament.maxParticipants) * 100} 
                                  className={`h-2 ${isFilled ? 'bg-orange-500' : ''}`}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-slate-300">
                                    {timeLeft > 0 ? `${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m` : 'Starting Soon'}
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewTournament(tournament)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  {userParticipations.has(tournament.id) ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      <Users className="w-3 h-3 mr-1" />
                                      Joined
                                    </Badge>
                                  ) : isFilled ? (
                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                      <Users className="w-3 h-3 mr-1" />
                                      Full
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleJoinTournament(tournament)}
                                      disabled={loading}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                    >
                                      <Users className="w-4 h-4 mr-1" />
                                      Join Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No Tournaments State */}
            {!isLoadingTournaments && activeTournaments.length === 0 && upcomingTournaments.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Active Tournaments</h3>
                <p className="text-slate-400 mb-6">Be the first to create a tournament and start competing!</p>
                <Button onClick={handleCreateTournament} className="bg-emerald-600 hover:bg-emerald-700">
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Tournament
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Completed Tournaments */}
        {!isLoadingTournaments && selectedTab === "completed" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-purple-600" />
              Completed Tournaments
            </h2>
            {!isLoadingTournaments && completedTournaments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {completedTournaments.map((tournament) => {
                  const modeIcon = getGameModeIcon(tournament.mode)
                  const modeColor = getGameModeColor(tournament.mode)
                  
                  return (
                    <Card
                      key={tournament.id}
                      className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 ${modeColor} rounded-xl flex items-center justify-center`}>
                            {React.createElement(modeIcon, { className: "w-6 h-6" })}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white mb-1">{tournament.name}</h3>
                            <p className="text-sm text-slate-300 mb-3">{getModeName(tournament.mode)} Tournament</p>

                            {tournament.winner && tournament.winner !== "0x0000000000000000000000000000000000000000" && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Crown className="w-5 h-5 text-yellow-600" />
                                  <span className="font-medium text-yellow-800">Winner</span>
                                </div>
                                <p className="text-sm text-gray-700">{tournament.winner.slice(0, 6)}...{tournament.winner.slice(-4)}</p>
                                <p className="font-bold text-green-600">{tournament.prizePool} MNT</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-slate-400">
                                {tournament.maxParticipants} participants • Completed
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewResults(tournament.id)}
                                className="rounded-lg bg-transparent"
                              >
                                View Results
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : !isLoadingTournaments ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Completed Tournaments</h3>
                <p className="text-slate-400">Tournament results will appear here once they're completed.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Create Tournament Button - Admin Only */}
        <div className="text-center mt-12">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 max-w-md mx-auto">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Tournament Creation</h3>
            <p className="text-slate-300 text-sm mb-4">
              Tournament creation is restricted to administrators only to ensure quality and prevent spam. 
              Only the tournament contract owner can create new tournaments.
            </p>
            
            {/* Show create button only if user is admin */}
            {isAdmin ? (
              <Button
                onClick={handleCreateTournament}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-300 text-sm">
                  <strong>Admin Access Required</strong>
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Only tournament administrators can create new tournaments.
                </p>
              </div>
            )}
            
            <p className="text-xs text-slate-400 mt-3">
              Contact the tournament administrator if you'd like to suggest a tournament.
            </p>
          </div>
        </div>

        {/* Participation Info */}
        {address && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center space-x-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">
                {userParticipations.size > 0 
                  ? `You have joined ${userParticipations.size} tournament${userParticipations.size !== 1 ? 's' : ''}. Look for the green "Joined" badge to see your participations.`
                  : "Connect your wallet and join tournaments to start competing!"
                }
              </span>
            </div>
          </div>
        )}

        {/* Debug Info - Remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center mt-4">
            <details className="inline-block">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                Debug: Tournament Statuses
              </summary>
              <div className="mt-2 text-xs text-slate-400 bg-slate-800/40 rounded p-2 text-left">
                <div>Active: {activeTournaments.length}</div>
                <div>Upcoming: {upcomingTournaments.length}</div>
                <div>Completed: {completedTournaments.length}</div>
                <div>Total: {activeTournaments.length + upcomingTournaments.length + completedTournaments.length}</div>
                {upcomingTournaments.map(t => (
                  <div key={t.id} className="ml-2">
                    #{t.id}: {t.currentParticipants}/{t.maxParticipants} - Status: {t.status}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Tournament Bracket Modal */}
        {selectedTournament && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                    <p className="text-slate-300">
                      {getModeName(selectedTournament.mode)} Tournament • Round {selectedTournament.currentRound}/{selectedTournament.totalRounds}
                    </p>
                  </div>
                  <Button
                    onClick={closeTournamentView}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {tournamentBracket ? (
                  <div className="space-y-6">
                    {/* Tournament Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-white">{selectedTournament.currentParticipants}</div>
                        <div className="text-sm text-slate-400">Participants</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">{selectedTournament.prizePool} MNT</div>
                        <div className="text-sm text-slate-400">Prize Pool</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">{selectedTournament.entryFee} MNT</div>
                        <div className="text-sm text-slate-400">Entry Fee</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">{selectedTournament.totalRounds}</div>
                        <div className="text-sm text-slate-400">Total Rounds</div>
                      </div>
                    </div>

                    {/* Tournament Bracket */}
                    <div className="space-y-8">
                      {tournamentBracket.rounds.map((round: any, roundIndex: number) => (
                        <div key={round.round} className="space-y-4">
                          <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
                            Round {round.round}
                            {round.round === tournamentBracket.currentRound && (
                              <Badge className="ml-2 bg-green-600">Current</Badge>
                            )}
                          </h3>
                          
                          <div className="grid gap-4">
                            {round.matches.map((match: any, matchIndex: number) => (
                              <div
                                key={`${round.round}-${matchIndex}`}
                                className={`bg-slate-800 rounded-lg p-4 border-2 ${
                                  match.done ? 'border-green-500/30' : 'border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        match.done && match.winner === match.player1 ? 'bg-green-500' : 'bg-slate-600'
                                      }`} />
                                      <span className={`font-medium ${
                                        match.done && match.winner === match.player1 ? 'text-green-400' : 'text-white'
                                      }`}>
                                        {match.player1 ? `${match.player1.slice(0, 6)}...${match.player1.slice(-4)}` : 'TBD'}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        match.done && match.winner === match.player2 ? 'bg-green-500' : 'bg-slate-600'
                                      }`} />
                                      <span className={`font-medium ${
                                        match.done && match.winner === match.player2 ? 'text-green-400' : 'text-white'
                                      }`}>
                                        {match.player2 ? `${match.player2.slice(0, 6)}...${match.player2.slice(-4)}` : 'TBD'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right space-y-2">
                                    {match.done ? (
                                      <Badge className="bg-green-600">Completed</Badge>
                                    ) : match.player1 && match.player2 ? (
                                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                                        Ready to Play
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                                        Waiting for Players
                                      </Badge>
                                    )}
                                    
                                    {/* Gameplay and Admin Controls */}
                                    {!match.done && match.player1 && match.player2 && (
                                      <div className="space-y-2">
                                        {/* Play Game Button - Only show if user is one of the players */}
                                        {(address === match.player1 || address === match.player2) && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleQuickPlay(
                                              selectedTournament.id,
                                              round.round,
                                              match.index
                                            )}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full"
                                          >
                                            🎮 Play Game
                                          </Button>
                                        )}
                                        
                                        {/* Spectate Button - For other users */}
                                        {address !== match.player1 && address !== match.player2 && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handlePlayMatch(
                                              selectedTournament.id,
                                              round.round,
                                              match.index,
                                              match.player1,
                                              match.player2
                                            )}
                                            className="border-blue-500 text-blue-400 hover:bg-blue-500/20 text-xs w-full"
                                          >
                                            👁️ Spectate
                                          </Button>
                                        )}
                                        
                                        {/* Admin: Record Result Buttons */}
                                        {isAdmin && (
                                          <div className="border-t border-slate-600 pt-2 mt-2">
                                            <p className="text-xs text-slate-400 mb-2">Admin: Record Result</p>
                                          <Button
                                            size="sm"
                                            onClick={() => handleRecordMatchResult(
                                              selectedTournament.id,
                                              round.round,
                                              match.index,
                                              match.player1
                                            )}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full mb-1"
                                          >
                                            {match.player1.slice(0, 6)}... wins
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => handleRecordMatchResult(
                                              selectedTournament.id,
                                              round.round,
                                              match.index,
                                              match.player2
                                            )}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full"
                                          >
                                            {match.player2.slice(0, 6)}... wins
                                                                                      </Button>
                                        </div>
                                        )}
                                      </div>
                                    )}

                                    {/* For matches without players yet */}
                                    {!match.done && (!match.player1 || !match.player2) && (
                                      <div className="space-y-2">
                                        <p className="text-xs text-slate-400 text-center">
                                          Waiting for players to join...
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled
                                          className="border-slate-600 text-slate-500 text-xs w-full cursor-not-allowed"
                                        >
                                          ⏳ Match Not Ready
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User Stats */}
                    {userStats && (
                      <div className="bg-slate-800 rounded-lg p-4 mt-6">
                        <h4 className="text-lg font-bold text-white mb-3">Your Tournament Stats</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{userStats.played}</div>
                            <div className="text-sm text-slate-400">Tournaments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{userStats.won}</div>
                            <div className="text-sm text-slate-400">Wins</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{userStats.winRate}%</div>
                            <div className="text-sm text-slate-400">Win Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{userStats.earnings} MNT</div>
                            <div className="text-sm text-slate-400">Earnings</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* How to Play Section */}
                    <div className="bg-slate-800 rounded-lg p-4 mt-6">
                      <h4 className="text-lg font-bold text-white mb-3">🎮 How to Play Tournament Matches</h4>
                      <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex items-start space-x-2">
                          <span className="text-emerald-400">1.</span>
                          <span>Click <strong>"Play Game"</strong> on your match to create a new game</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-emerald-400">2.</span>
                          <span>You'll be redirected to the game interface where you can make moves</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-emerald-400">3.</span>
                          <span>Play the game using the same rules as regular {getModeName(selectedTournament.mode)} games</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-emerald-400">4.</span>
                          <span>Winner gets recorded in the tournament bracket automatically</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-emerald-400">5.</span>
                          <span>Tournament progresses to the next round when all matches are complete</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                        <p className="text-sm text-emerald-300">
                          <strong>💡 Tip:</strong> Each tournament match creates a separate game instance. 
                          The winner of the game becomes the winner of the match in the tournament bracket.
                        </p>
                        <p className="text-sm text-emerald-300 mt-2">
                          <strong>🎮 Game Routing:</strong> Hardcore and Last Stand games automatically route to 
                          <code className="bg-emerald-600/30 px-1 rounded">/battle/hardcore/[id]</code>, 
                          while Quick Draw and Strategic games go to <code className="bg-emerald-600/30 px-1 rounded">/battle/[id]</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading tournament bracket...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}