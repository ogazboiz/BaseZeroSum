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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BattleFilters,
  BattleSearch,
  BattleCard,
  EmptyBattleState,
  type BattleFilter,
  type Battle
} from "@/components/battle"

export default function BrowseGamesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filters: BattleFilter[] = [
    { id: "all", label: "ALL BATTLES", count: 89 },
    { id: "quick-draw", label: "QUICK DRAW", count: 28 },
    { id: "strategic", label: "STRATEGIC", count: 22 },
    { id: "mystery", label: "MYSTERY", count: 39 },
  ]

  const activeBattles: Battle[] = [
    {
      id: 1,
      mode: "Quick Draw",
      modeId: "quick-draw",
      creator: "WarriorX",
      entryFee: "0.1",
      prizePool: "0.19",
      timeLeft: "4m 32s",
      spectators: 12,
      difficulty: "★★☆☆☆",
      icon: <Target className="w-7 h-7 text-white" />,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      isHot: true,
      status: "WAITING",
    },
    {
      id: 2,
      mode: "Hardcore Mystery",
      modeId: "hardcore-mystery",
      creator: "ShadowMaster",
      entryFee: "0.5",
      prizePool: "0.95",
      timeLeft: "2m 15s",
      spectators: 28,
      difficulty: "★★★★★",
      icon: <Zap className="w-7 h-7 text-white" />,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-pink-900/20",
      isHot: true,
      status: "WAITING",
    },
    {
      id: 3,
      mode: "Strategic",
      modeId: "strategic",
      creator: "MindBender",
      entryFee: "0.25",
      prizePool: "0.475",
      timeLeft: "7m 45s",
      spectators: 8,
      difficulty: "★★★☆☆",
      icon: <Brain className="w-7 h-7 text-white" />,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      isHot: false,
      status: "WAITING",
    },
    {
      id: 4,
      mode: "Pure Mystery",
      modeId: "pure-mystery",
      creator: "GhostPlayer",
      entryFee: "0.3",
      prizePool: "0.57",
      timeLeft: "1m 58s",
      spectators: 19,
      difficulty: "★★★★☆",
      icon: <Eye className="w-7 h-7 text-white" />,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgGradient: "from-violet-900/20 to-purple-900/20",
      isHot: false,
      status: "WAITING",
    },
    {
      id: 5,
      mode: "Quick Draw",
      modeId: "quick-draw",
      creator: "SpeedDemon",
      entryFee: "0.05",
      prizePool: "0.095",
      timeLeft: "12m 20s",
      spectators: 5,
      difficulty: "★★☆☆☆",
      icon: <Target className="w-7 h-7 text-white" />,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      isHot: false,
      status: "WAITING",
    },
    {
      id: 6,
      mode: "Strategic",
      modeId: "strategic",
      creator: "TacticalGenius",
      entryFee: "0.75",
      prizePool: "1.425",
      timeLeft: "3m 42s",
      spectators: 34,
      difficulty: "★★★☆☆",
      icon: <Brain className="w-7 h-7 text-white" />,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      isHot: true,
      status: "WAITING",
    },
  ]

  const filteredBattles = activeBattles.filter((battle) => {
    const matchesSearch =
      battle.mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battle.creator.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === "all") return matchesSearch
    if (selectedFilter === "mystery") return matchesSearch && battle.mode.includes("Mystery")
    return matchesSearch && battle.modeId === selectedFilter
  })

  const handleJoinBattle = (battleId: number, modeId: string) => {
    router.push(`/battle/join/${battleId}?mode=${modeId}`)
  }

  const handleWatchBattle = (battleId: number, modeId: string) => {
    router.push(`/spectate/${battleId}?mode=${modeId}`)
  }

  const handleCreateBattle = () => {
    router.push("/create")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Gaming Navigation */}
      <nav className="relative z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                  ZEROSUM
                </span>
                <div className="text-xs text-slate-400 font-medium">BATTLE ARENA</div>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400">2.45 ETH</span>
                </div>
              </div>
              <Button
                onClick={() => router.push("/create")}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
              >
                CREATE BATTLE
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <BattleSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <BattleFilters 
            filters={filters} 
            selectedFilter={selectedFilter} 
            onFilterSelect={setSelectedFilter} 
          />
        </div>

        {/* Battles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBattles.map((battle) => (
            <BattleCard
              key={battle.id}
              battle={battle}
              onJoinBattle={handleJoinBattle}
              onWatchBattle={handleWatchBattle}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredBattles.length === 0 && (
          <EmptyBattleState onCreateBattle={handleCreateBattle} />
        )}
      </div>
    </div>
  )
}
