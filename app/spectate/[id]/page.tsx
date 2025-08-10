"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Gamepad2, Target, Brain, Eye, Zap, Coins, Users, TrendingUp, Crown, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"

export default function SpectateBattlePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const battleId = params.id
  const mode = searchParams.get("mode") || "quick-draw"

  const [betAmount, setBetAmount] = useState("0.1")
  const [selectedWarrior, setSelectedWarrior] = useState("")
  const [chatMessage, setChatMessage] = useState("")

  // Game mode configurations
  const gameModeConfigs = {
    "quick-draw": {
      title: "Quick Draw",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      currentNumber: 23,
      isHidden: false,
    },
    strategic: {
      title: "Strategic",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      currentNumber: 127,
      isHidden: false,
    },
    "pure-mystery": {
      title: "Pure Mystery",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      currentNumber: "???",
      isHidden: true,
    },
    "hardcore-mystery": {
      title: "Hardcore Mystery",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      currentNumber: "???",
      isHidden: true,
    },
  }

  const config = gameModeConfigs[mode] || gameModeConfigs["quick-draw"]

  // Mock battle data
  const [battle, setBattle] = useState({
    id: battleId,
    mode: config.title,
    warriors: ["WarriorX", "PlayerY"],
    currentPlayer: "WarriorX",
    currentNumber: config.currentNumber,
    isHidden: config.isHidden,
    round: 5,
    maxRounds: 15,
    timeLeft: 142, // seconds
    spectators: 28,
    bettingPool: "2.4",
    odds: { WarriorX: 1.8, PlayerY: 2.2 },
    icon: config.icon,
    gradient: config.gradient,
    moves: [
      { player: "WarriorX", move: 15, newNumber: config.isHidden ? "???" : 38, timestamp: "2m ago" },
      { player: "PlayerY", move: 12, newNumber: config.isHidden ? "???" : 26, timestamp: "1m ago" },
      { player: "WarriorX", move: 3, newNumber: config.currentNumber, timestamp: "30s ago" },
    ],
  })

  const [chatMessages, setChatMessages] = useState([
    { user: "Spectator1", message: "This is intense!", timestamp: "1m ago" },
    { user: "BetMaster", message: "Going all in on WarriorX!", timestamp: "45s ago" },
    { user: "GameWatcher", message: "PlayerY has this!", timestamp: "20s ago" },
  ])

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setBattle((prev) => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlaceBet = () => {
    if (!selectedWarrior || !betAmount) return

    // Simulate bet placement
    alert(`Bet placed: ${betAmount} ETH on ${selectedWarrior}`)
    // Reset form
    setSelectedWarrior("")
    setBetAmount("0.1")
  }

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return

    setChatMessages((prev) => [...prev, { user: "You", message: chatMessage, timestamp: "now" }])
    setChatMessage("")
  }

  const handleBackToSpectate = () => {
    router.push("/spectate")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
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
                <div className="text-xs text-slate-400 font-medium">SPECTATOR MODE</div>
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
                onClick={handleBackToSpectate}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl font-bold bg-transparent"
              >
                ALL BATTLES
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Battle View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${battle.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <battle.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black text-white">{battle.mode}</CardTitle>
                      <p className="text-slate-300 font-medium">
                        {battle.warriors[0]} vs {battle.warriors[1]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold mb-2">
                      <div className="w-2 h-2 bg-rose-400 rounded-full mr-2 animate-pulse"></div>
                      LIVE
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 font-medium">{battle.spectators} watching</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Current Game State */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-white">CURRENT STATE</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-black text-white mb-4">{battle.currentNumber}</div>
                  <p className="text-slate-300 font-medium mb-4">
                    {battle.isHidden ? "Hidden Number" : "Current Number"}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Round:</span>
                    <span className="text-white font-bold">
                      {battle.round}/{battle.maxRounds}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-white">TURN TIMER</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div
                      className={`text-4xl font-black ${battle.timeLeft < 60 ? "text-rose-400" : "text-cyan-400"} mb-2`}
                    >
                      {formatTime(battle.timeLeft)}
                    </div>
                    <p className="text-slate-300 font-medium">{battle.currentPlayer}'s Turn</p>
                  </div>
                  <Progress
                    value={(battle.timeLeft / 180) * 100}
                    className={`h-3 ${battle.timeLeft < 60 ? "bg-rose-900/50" : "bg-slate-800/50"}`}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Battle History */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">BATTLE HISTORY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {battle.moves.map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            move.player === battle.warriors[0]
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-violet-500/20 text-violet-400"
                          }`}
                        >
                          <span className="font-bold text-sm">{move.player[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{move.player}</p>
                          <p className="text-sm text-slate-400">{move.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">-{move.move}</p>
                        <p className="text-sm text-slate-400">→ {move.newNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Chat */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  LIVE CHAT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-32 overflow-y-auto mb-4">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="font-bold text-cyan-400 text-sm">{msg.user}:</span>
                      <span className="text-slate-300 text-sm flex-1">{msg.message}</span>
                      <span className="text-slate-500 text-xs">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-slate-900/40 border-slate-600/50 text-white rounded-xl flex-1"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Betting Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Betting Pool */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                  BETTING POOL
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-black text-emerald-400 mb-2">{battle.bettingPool} ETH</div>
                <p className="text-slate-300 text-sm">Total Bets Placed</p>
              </CardContent>
            </Card>

            {/* Place Bet */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">PLACE YOUR BET</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-white mb-3 block">CHOOSE WARRIOR</label>
                  <div className="space-y-2">
                    {battle.warriors.map((warrior) => (
                      <Button
                        key={warrior}
                        variant={selectedWarrior === warrior ? "default" : "outline"}
                        onClick={() => setSelectedWarrior(warrior)}
                        className={`w-full rounded-xl p-3 h-auto flex justify-between font-bold transition-all duration-200 ${
                          selectedWarrior === warrior
                            ? `bg-gradient-to-r ${battle.gradient} text-white shadow-lg shadow-cyan-500/25`
                            : "border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        <span className="font-bold">{warrior}</span>
                        <span className={`text-sm font-semibold ${
                          selectedWarrior === warrior ? "text-white" : "text-cyan-400"
                        }`}>
                          {battle.odds[warrior]}x
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-white mb-3 block">BET AMOUNT (ETH)</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-slate-800/80 border-slate-500/50 text-white rounded-xl text-lg font-bold placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    placeholder="0.1"
                    step="0.01"
                    min="0.01"
                  />
                </div>

                {selectedWarrior && betAmount && (
                  <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/50 rounded-xl p-4 shadow-lg">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-200 font-semibold">Potential Win:</span>
                      <span className="font-black text-emerald-400 text-lg">
                        {(Number.parseFloat(betAmount) * battle.odds[selectedWarrior]).toFixed(3)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-200 font-semibold">Profit:</span>
                      <span className="font-black text-cyan-400 text-lg">
                        {(
                          Number.parseFloat(betAmount) * battle.odds[selectedWarrior] -
                          Number.parseFloat(betAmount)
                        ).toFixed(3)}{" "}
                        ETH
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePlaceBet}
                  disabled={!selectedWarrior || !betAmount}
                  className={`w-full bg-gradient-to-r ${battle.gradient} hover:shadow-2xl text-white font-black py-3 rounded-xl transition-all transform hover:scale-105`}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  PLACE BET
                </Button>
              </CardContent>
            </Card>

            {/* Warriors */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">WARRIORS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {battle.warriors.map((warrior, index) => (
                  <div
                    key={warrior}
                    className={`p-3 rounded-xl border-2 ${
                      battle.currentPlayer === warrior
                        ? "border-cyan-500/50 bg-cyan-900/20"
                        : "border-slate-600/50 bg-slate-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index === 0 ? "bg-cyan-500/20 text-cyan-400" : "bg-violet-500/20 text-violet-400"
                          }`}
                        >
                          <span className="font-bold text-sm">{warrior[0]}</span>
                        </div>
                        <span className="font-bold text-white text-sm">{warrior}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{battle.odds[warrior]}x</span>
                    </div>
                    {battle.currentPlayer === warrior && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span className="text-cyan-400 font-bold text-xs">ACTIVE TURN</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
