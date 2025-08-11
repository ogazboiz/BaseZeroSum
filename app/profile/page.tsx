"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Gamepad2,
  User,
  Target,
  Brain,
  Eye,
  Zap,
  TrendingUp,
  Coins,
  Star,
  Settings,
  Bot,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState("overview")

  const playerStats = {
    address: "0x1234...5678",
    joinDate: "March 2024",
    totalGames: 127,
    wins: 89,
    winRate: 70,
    totalEarnings: "12.45",
    currentStreak: 5,
    bestStreak: 12,
    favoriteMode: "Pure Mystery",
    stakingTier: "Gold (1.25x)",
  }

  const gameHistory = [
    {
      id: 1,
      mode: "Hardcore Mystery",
      opponent: "0x8765...4321",
      result: "Won",
      prize: "0.95 ETH",
      date: "2 hours ago",
      icon: Zap,
      color: "text-emerald-400",
    },
    {
      id: 2,
      mode: "Quick Draw",
      opponent: "0x2468...1357",
      result: "Won",
      prize: "0.19 ETH",
      date: "1 day ago",
      icon: Target,
      color: "text-emerald-400",
    },
    {
      id: 3,
      mode: "Strategic",
      opponent: "0x9876...5432",
      result: "Lost",
      prize: "-0.25 ETH",
      date: "3 days ago",
      icon: Brain,
      color: "text-red-400",
    },
    {
      id: 4,
      mode: "Pure Mystery",
      opponent: "0x5432...9876",
      result: "Won",
      prize: "0.57 ETH",
      date: "5 days ago",
      icon: Eye,
      color: "text-emerald-400",
    },
  ]

  const achievements = [
    {
      title: "Mystery Master",
      description: "Win 50 Mystery games",
      progress: 47,
      total: 50,
      icon: Eye,
      color: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
    },
    {
      title: "Streak Legend",
      description: "Achieve 15 win streak",
      progress: 12,
      total: 15,
      icon: Star,
      color: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    },
    {
      title: "High Roller",
      description: "Win games worth 10+ ETH total",
      progress: 8.7,
      total: 10,
      icon: Coins,
      color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
  ]

  const modeStats = [
    { mode: "Quick Draw", games: 45, wins: 32, winRate: 71, icon: Target, color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
    { mode: "Strategic", games: 38, wins: 25, winRate: 66, icon: Brain, color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
    { mode: "Pure Mystery", games: 28, wins: 20, winRate: 71, icon: Eye, color: "bg-violet-500/20 text-violet-400 border border-violet-500/30" },
    { mode: "Hardcore Mystery", games: 16, wins: 12, winRate: 75, icon: Zap, color: "bg-red-500/20 text-red-400 border border-red-500/30" },
  ]

  return (

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation */}
        <UnifiedGamingNavigation />

        {/* Profile Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{playerStats.address}</h1>
            <p className="text-xl text-slate-300">Member since {playerStats.joinDate}</p>
          </div>

          {/* AI Player Analysis Coming Soon */}
          <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bot className="w-8 h-8 text-violet-400" />
                  <div>
                    <h3 className="font-bold text-white">AI Player Analysis</h3>
                    <p className="text-slate-300 text-sm">
                      Get detailed AI insights into your playing patterns, strengths, and improvement areas
                    </p>
                  </div>
                </div>
                <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/30">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-2xl mb-8 w-fit mx-auto">
            {[
              { id: "overview", label: "Overview" },
              { id: "history", label: "Game History" },
              { id: "achievements", label: "Achievements" },
              { id: "stats", label: "Detailed Stats" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? "default" : "ghost"}
                onClick={() => setSelectedTab(tab.id)}
                className="rounded-xl px-6"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Stats */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl mb-6">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Player Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{playerStats.totalGames}</div>
                        <div className="text-sm text-slate-300">Total Games</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-400 mb-1">{playerStats.wins}</div>
                        <div className="text-sm text-slate-300">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-1">{playerStats.winRate}%</div>
                        <div className="text-sm text-slate-300">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-violet-400 mb-1">{playerStats.totalEarnings}</div>
                        <div className="text-sm text-slate-300">ETH Earned</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Mode Performance */}
                <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Performance by Game Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {modeStats.map((mode, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode.color}`}>
                              <mode.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{mode.mode}</h3>
                              <p className="text-sm text-slate-300">{mode.games} games played</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{mode.winRate}%</div>
                            <div className="text-sm text-slate-300">
                              {mode.wins}/{mode.games}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Side Panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Current Status */}
                <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Win Streak:</span>
                      <span className="font-bold text-emerald-400">{playerStats.currentStreak} games</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Best Streak:</span>
                      <span className="font-bold text-white">{playerStats.bestStreak} games</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Favorite Mode:</span>
                      <span className="font-bold text-violet-400">{playerStats.favoriteMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Staking Tier:</span>
                      <span className="font-bold text-blue-400">{playerStats.stakingTier}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/create">
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
                        Create New Game
                      </Button>
                    </Link>
                    <Link href="/browse">
                      <Button variant="outline" className="w-full rounded-xl bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white">
                        Browse Games
                      </Button>
                    </Link>
                    <Link href="/staking">
                      <Button variant="outline" className="w-full rounded-xl bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white">
                        Manage Staking
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Game History Tab */}
          {selectedTab === "history" && (
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Recent Game History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gameHistory.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                          <game.icon className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{game.mode}</h3>
                          <p className="text-sm text-slate-300">vs {game.opponent}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${game.color}`}>{game.result}</div>
                        <div className={`text-sm ${game.color}`}>{game.prize}</div>
                      </div>
                      <div className="text-sm text-slate-400">{game.date}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements Tab */}
          {selectedTab === "achievements" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${achievement.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <achievement.icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{achievement.title}</h3>
                    <p className="text-sm text-slate-300 mb-4">{achievement.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Progress</span>
                        <span className="text-white">
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detailed Stats Tab */}
          {selectedTab === "stats" && (
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                      <p>Detailed analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Advanced Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Average Game Duration:</span>
                      <span className="font-medium text-white">4m 32s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Favorite Opponent Type:</span>
                      <span className="font-medium text-white">Aggressive</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Best Time of Day:</span>
                      <span className="font-medium text-white">Evening</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Mystery Game Accuracy:</span>
                      <span className="font-medium text-white">73%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
  )
}
