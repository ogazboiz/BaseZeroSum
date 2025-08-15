"use client"

import { useState } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function TournamentsPage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("active")

  const activeTournaments = [
    {
      id: 1,
      name: "Mystery Masters Championship",
      type: "Pure Mystery",
      players: 32,
      joined: 28,
      entryFee: "0.1",
      prizePool: "3.04",
      startTime: "2h 15m",
      status: "Filling",
      icon: Eye,
      color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      difficulty: "Advanced",
      comingSoon: true,
    },
    {
      id: 2,
      name: "Hardcore Survivors Cup",
      type: "Hardcore Mystery",
      players: 16,
      joined: 16,
      entryFee: "0.5",
      prizePool: "7.6",
      startTime: "Live",
      status: "Active",
      icon: Zap,
      color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      difficulty: "Expert",
      comingSoon: true,
    },
    {
      id: 3,
      name: "Quick Draw Blitz",
      type: "Quick Draw",
      players: 64,
      joined: 45,
      entryFee: "0.05",
      prizePool: "2.88",
      startTime: "45m",
      status: "Filling",
      icon: Target,
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      difficulty: "Beginner",
      comingSoon: true,
    },
  ]

  const upcomingTournaments = [
    {
      id: 4,
      name: "Strategic Masters League",
      type: "Strategic",
      players: 32,
      entryFee: "0.25",
      estimatedPrize: "7.6",
      startDate: "Tomorrow 8:00 PM",
      icon: Brain,
      color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      difficulty: "Intermediate",
    },
    {
      id: 5,
      name: "Last Stand Royale",
      type: "Last Stand",
      players: 64,
      entryFee: "0.05",
      estimatedPrize: "3.04",
      startDate: "This Weekend",
      icon: Users,
      color: "bg-orange-100 text-orange-700",
      difficulty: "All Levels",
    },
  ]

  const completedTournaments = [
    {
      id: 6,
      name: "Midnight Mystery Cup",
      type: "Hardcore Mystery",
      winner: "0x1234...5678",
      prize: "4.75 MNT",
      participants: 16,
      completedDate: "2 days ago",
      icon: Zap,
      color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    },
    {
      id: 7,
      name: "Speed Draw Championship",
      type: "Quick Draw",
      winner: "0x8765...4321",
      prize: "2.85 MNT",
      participants: 32,
      completedDate: "1 week ago",
      icon: Target,
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
  ]

  const handleJoinTournament = (tournamentId) => {
    // Simulate joining tournament
    alert(`Joining tournament ${tournamentId}...`)
    // In real app, this would redirect to tournament join page
  }

  const handleWatchTournament = (tournamentId) => {
    // Simulate watching tournament
    router.push(`/tournaments/${tournamentId}/watch`)
  }

  const handleCreateTournament = () => {
    router.push("/tournaments/create")
  }

  const handleSetReminder = (tournamentId) => {
    alert(`Reminder set for tournament ${tournamentId}`)
  }

  const handleViewResults = (tournamentId) => {
    router.push(`/tournaments/${tournamentId}/results`)
  }

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
        </div>

        {/* Coming Soon Overlay */}
        <div className="relative mb-8">
          <div className="bg-slate-900/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🚧</div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-2">Tournaments Coming Soon</h2>
            <p className="text-slate-300 mb-4">
              Tournament functionality is currently under development. You can view the planned tournaments below, but joining and participating will be available soon!
            </p>
            <div className="inline-flex items-center space-x-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-cyan-400">Development in Progress</span>
            </div>
          </div>
        </div>

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
            { label: "Active Tournaments", value: "3", icon: Trophy, color: "text-yellow-600" },
            { label: "Total Players", value: "89", icon: Users, color: "text-blue-600" },
            { label: "Prize Pools", value: "13.52 MNT", icon: Coins, color: "text-green-600" },
            { label: "This Week", value: "2 Completed", icon: Calendar, color: "text-purple-600" },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
            >
              <CardContent className="p-6 text-center">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tournament Tabs */}
        <div className="flex space-x-1 bg-white/50 p-1 rounded-2xl mb-8 w-fit mx-auto">
          {[
            { id: "active", label: "Active & Upcoming", count: activeTournaments.length + upcomingTournaments.length },
            { id: "completed", label: "Completed", count: completedTournaments.length },
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

        {/* Active & Upcoming Tournaments */}
        {selectedTab === "active" && (
          <div className="space-y-8">
            {/* Active Tournaments */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
                Active Tournaments
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTournaments.map((tournament) => (
                  <Card
                    key={tournament.id}
                    className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-12 h-12 ${tournament.color} rounded-xl flex items-center justify-center mb-3`}
                        >
                          <tournament.icon className="w-6 h-6" />
                        </div>
                        <Badge
                          className={
                            tournament.status === "Active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                        >
                          {tournament.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-white">{tournament.name}</CardTitle>
                      <p className="text-sm text-slate-300">{tournament.type} Tournament</p>
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
                            Players: {tournament.joined}/{tournament.players}
                          </span>
                          <span>{tournament.startTime}</span>
                        </div>
                        <Progress value={(tournament.joined / tournament.players) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {tournament.difficulty}
                        </Badge>
                        <Button
                          size="sm"
                          disabled
                          className="bg-slate-600 cursor-not-allowed text-slate-300 rounded-lg"
                        >
                          <div className="w-4 h-4 mr-1">🚧</div>
                          Coming Soon
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Upcoming Tournaments */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                Upcoming Tournaments
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingTournaments.map((tournament) => (
                  <Card
                    key={tournament.id}
                    className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${tournament.color} rounded-xl flex items-center justify-center`}>
                          <tournament.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white mb-1">{tournament.name}</h3>
                          <p className="text-sm text-slate-300 mb-3">{tournament.type} Tournament</p>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-slate-400">Players</p>
                              <p className="font-medium text-white">{tournament.players}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Entry Fee</p>
                              <p className="font-medium text-white">{tournament.entryFee} MNT</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Est. Prize</p>
                              <p className="font-medium text-green-600">{tournament.estimatedPrize} MNT</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-slate-300">{tournament.startDate}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetReminder(tournament.id)}
                              className="rounded-lg bg-transparent"
                            >
                              Set Reminder
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Tournaments */}
        {selectedTab === "completed" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-purple-600" />
              Completed Tournaments
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {completedTournaments.map((tournament) => (
                <Card
                  key={tournament.id}
                  className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${tournament.color} rounded-xl flex items-center justify-center`}>
                        <tournament.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white mb-1">{tournament.name}</h3>
                        <p className="text-sm text-slate-300 mb-3">{tournament.type} Tournament</p>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Crown className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Winner</span>
                          </div>
                          <p className="text-sm text-gray-700">{tournament.winner}</p>
                          <p className="font-bold text-green-600">{tournament.prize}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">
                            {tournament.participants} participants • {tournament.completedDate}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
