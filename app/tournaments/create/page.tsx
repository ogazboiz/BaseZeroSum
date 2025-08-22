"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Users, 
  Coins, 
  Calendar, 
  Settings, 
  Zap,
  Gamepad2,
  ArrowLeft,
  Target,
  Brain
} from "lucide-react"
import Link from "next/link"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { useUnifiedGameContract, UnifiedGameMode, getModeName } from "@/hooks/useUnifiedGameContracts"
import { useAccount } from "wagmi"
import { toast } from "react-hot-toast"

export default function CreateTournamentPage() {
  const router = useRouter()
  const { address } = useAccount()
  
  const [tournamentName, setTournamentName] = useState("")
  const [selectedGameMode, setSelectedGameMode] = useState<UnifiedGameMode>(UnifiedGameMode.QUICK_DRAW)
  const [entryFee, setEntryFee] = useState([0.1])
  const [maxPlayers, setMaxPlayers] = useState([8])
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowSpectators, setAllowSpectators] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Use the unified hook
  const { loading, createTournament } = useUnifiedGameContract()

  const handleCreateTournament = async () => {
    if (!address) {
      toast.error('Please connect your wallet to create tournaments')
      return
    }

    if (!tournamentName.trim()) {
      toast.error('Please enter a tournament name')
      return
    }
    
    setIsCreating(true)
    try {
      // Convert hours to a reasonable duration (e.g., 2-4 hours)
      const hours = 3 // Default to 3 hours
      
      const result = await createTournament(
        tournamentName,
        entryFee[0].toString(),
        maxPlayers[0],
        selectedGameMode,
        hours
      )
      
      if (result.success) {
        toast.success(`Tournament created successfully! ID: ${result.tournamentId}`)
        router.push(`/tournaments?created=${result.tournamentId}&mode=${selectedGameMode}`)
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
      // Error is already handled by the hook
    } finally {
      setIsCreating(false)
    }
  }

  // Adjust entry fee and max players based on game mode
  const getGameModeSettings = () => {
    switch (selectedGameMode) {
      case UnifiedGameMode.QUICK_DRAW:
        return { minEntryFee: 0.01, maxEntryFee: 0.5, defaultEntryFee: 0.05, maxPlayers: 64 }
      case UnifiedGameMode.STRATEGIC:
        return { minEntryFee: 0.1, maxEntryFee: 2.0, defaultEntryFee: 0.25, maxPlayers: 32 }
      case UnifiedGameMode.HARDCORE_MYSTERY:
        return { minEntryFee: 0.5, maxEntryFee: 5.0, defaultEntryFee: 1.0, maxPlayers: 16 }
      case UnifiedGameMode.LAST_STAND:
        return { minEntryFee: 0.05, maxEntryFee: 1.0, defaultEntryFee: 0.1, maxPlayers: 64 }
      default:
        return { minEntryFee: 0.01, maxEntryFee: 2.0, defaultEntryFee: 0.1, maxPlayers: 32 }
    }
  }

  const gameModeSettings = getGameModeSettings()
  const totalPrizePool = entryFee[0] * maxPlayers[0] * 0.9 // 90% of total entry fees

  // Update entry fee and max players when game mode changes
  useEffect(() => {
    setEntryFee([gameModeSettings.defaultEntryFee])
    setMaxPlayers([gameModeSettings.maxPlayers])
  }, [selectedGameMode])

  const gameModes = [
    {
      id: UnifiedGameMode.QUICK_DRAW,
      name: "Quick Draw",
      icon: Target,
      description: "Lightning fast battles",
      color: "from-emerald-400 to-teal-600",
    },
    {
      id: UnifiedGameMode.STRATEGIC,
      name: "Strategic",
      icon: Brain,
      description: "Mind games & strategy",
      color: "from-blue-400 to-indigo-600",
    },
    {
      id: UnifiedGameMode.HARDCORE_MYSTERY,
      name: "Hardcore Mystery",
      icon: Zap,
      description: "Ultimate challenge",
      color: "from-rose-400 to-pink-600",
    },
    {
      id: UnifiedGameMode.LAST_STAND,
      name: "Last Stand",
      icon: Users,
      description: "Battle royale",
      color: "from-orange-400 to-red-600",
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <UnifiedGamingNavigation/>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/tournaments">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full px-6 py-2 mb-6">
            <span className="text-amber-400 font-bold">CREATE TOURNAMENT</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">CREATE YOUR TOURNAMENT</h1>
          <p className="text-xl text-slate-300 font-medium">Set up a bracket-style competition for warriors to battle</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tournament Configuration */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black text-white flex items-center">
                  <Trophy className="w-8 h-8 mr-3 text-amber-400" />
                  TOURNAMENT DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-xl font-bold text-white">TOURNAMENT NAME</Label>
                  <Input
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Enter tournament name..."
                    className="bg-slate-700/50 border-slate-600 text-white text-lg font-bold h-12"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xl font-bold text-white">GAME MODE</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {gameModes.map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => setSelectedGameMode(mode.id)}
                        className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ${
                          selectedGameMode === mode.id
                            ? 'border-cyan-500 bg-cyan-500/10' 
                            : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-r ${mode.color} rounded-xl flex items-center justify-center mb-3`}>
                          <mode.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-white mb-1">{mode.name}</h4>
                        <p className="text-xs text-slate-400">{mode.description}</p>
                        {selectedGameMode === mode.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-xl font-bold text-white">ENTRY FEE</Label>
                    <div className="space-y-4">
                      <Slider
                        value={entryFee}
                        onValueChange={setEntryFee}
                        max={gameModeSettings.maxEntryFee}
                        min={gameModeSettings.minEntryFee}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="text-center">
                          <span className="text-3xl font-black text-amber-400">{entryFee[0]} MNT</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xl font-bold text-white">MAX PLAYERS</Label>
                    <div className="space-y-4">
                      <Slider
                        value={maxPlayers}
                        onValueChange={setMaxPlayers}
                        max={gameModeSettings.maxPlayers}
                        min={4}
                        step={4}
                        className="w-full"
                      />
                      <div className="text-center">
                        <span className="text-3xl font-black text-blue-400">{maxPlayers[0]} Players</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Settings */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black text-white flex items-center">
                  <Settings className="w-8 h-8 mr-3 text-blue-400" />
                  TOURNAMENT SETTINGS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl opacity-50 cursor-not-allowed">
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-slate-400" />
                      <div>
                        <Label className="text-lg font-bold text-slate-400">PRIVATE TOURNAMENT</Label>
                        <p className="text-sm text-slate-500">Coming soon - Only invited players can join</p>
                      </div>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                      className="opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-green-400" />
                      <div>
                        <Label className="text-lg font-bold text-white">ALLOW SPECTATORS</Label>
                        <p className="text-sm text-slate-400">Others can watch the tournament</p>
                      </div>
                    </div>
                    <Switch
                      checked={allowSpectators}
                      onCheckedChange={setAllowSpectators}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournament Summary & Create */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Zap className="w-7 h-7 mr-3 text-yellow-400" />
                  TOURNAMENT SUMMARY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tournament Info */}
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-white mb-3">TOURNAMENT INFO</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Game Mode:</span>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {getModeName(selectedGameMode)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Format:</span>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                        Single Elimination
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Rounds:</span>
                      <span className="font-bold text-white">
                        {Math.ceil(Math.log2(maxPlayers[0]))} Rounds
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-bold text-white">2-4 hours</span>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-white mb-3">FINANCIAL DETAILS</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Entry Fee:</span>
                      <span className="font-bold text-cyan-400">{entryFee[0]} MNT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Pool:</span>
                      <span className="font-bold text-emerald-400">{(entryFee[0] * maxPlayers[0]).toFixed(2)} MNT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Prize Pool:</span>
                      <span className="font-bold text-emerald-400">{totalPrizePool.toFixed(2)} MNT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Platform Fee:</span>
                      <span className="font-bold text-slate-400">{(entryFee[0] * maxPlayers[0] * 0.1).toFixed(2)} MNT</span>
                    </div>
                  </div>
                </div>

                {/* Tournament Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">Private</span>
                    </div>
                    <Badge variant="outline" className="border-slate-500/30 text-slate-400">
                      COMING SOON
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">Spectators</span>
                    </div>
                    <Badge variant={allowSpectators ? "default" : "outline"} className={allowSpectators ? "bg-green-500" : ""}>
                      {allowSpectators ? "ALLOWED" : "BLOCKED"}
                    </Badge>
                  </div>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateTournament}
                  disabled={!tournamentName.trim() || isCreating || loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-black text-xl py-6 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating || loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isCreating ? 'CREATING TOURNAMENT...' : 'PREPARING...'}
                    </>
                  ) : (
                    <>
                      <Trophy className="w-6 h-6 mr-2" />
                      CREATE TOURNAMENT
                    </>
                  )}
                </Button>

                {/* Info Text */}
                <p className="text-xs text-slate-400 text-center">
                  By creating this tournament, you agree to our terms and conditions. The tournament will start once all players have joined.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
