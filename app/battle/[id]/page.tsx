"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Gamepad2,
  Target,
  Brain,
  Eye,
  Zap,
  Clock,
  Users,
  Coins,
  Swords,
  Shield,
  AlertTriangle,
  Timer,
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"

export default function BattlePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const battleId = params.id
  const mode = searchParams.get("mode") || "quick-draw"

  // Game mode configurations
  const gameModeConfigs = {
    "quick-draw": {
      title: "Quick Draw",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      rules: "Subtract exactly 1 each turn",
      currentNumber: 23,
      isHidden: false,
    },
    strategic: {
      title: "Strategic",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      rules: "Subtract 10-30% each turn",
      currentNumber: 127,
      isHidden: false,
    },
    "pure-mystery": {
      title: "Pure Mystery",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      rules: "Any subtraction, forgiving",
      currentNumber: "???",
      isHidden: true,
    },
    "hardcore-mystery": {
      title: "Hardcore Mystery",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      rules: "Any subtraction, instant loss",
      currentNumber: "???",
      isHidden: true,
    },
  }

  const config = gameModeConfigs[mode] || gameModeConfigs["quick-draw"]

  // Battle state
  const [battle, setBattle] = useState({
    id: battleId,
    mode: config.title,
    creator: "WarriorX",
    opponent: "PlayerY",
    currentPlayer: "WarriorX",
    currentNumber: config.currentNumber,
    isHidden: config.isHidden,
    entryFee: "0.1",
    prizePool: "0.19",
    status: "active", // waiting, active, completed
    round: 5,
    maxRounds: 15,
    timeLeft: 180, // 3 minutes in seconds
    moves: [
      { player: "WarriorX", move: 15, newNumber: config.isHidden ? "???" : 38, timestamp: "2m ago" },
      { player: "PlayerY", move: 12, newNumber: config.isHidden ? "???" : 26, timestamp: "1m ago" },
      { player: "WarriorX", move: 3, newNumber: config.currentNumber, timestamp: "30s ago" },
    ],
    spectators: 12,
    icon: config.icon,
    gradient: config.gradient,
  })

  const [moveAmount, setMoveAmount] = useState("")
  const [isMyTurn, setIsMyTurn] = useState(true) // Simulate if it's player's turn

  // Timer countdown
  useEffect(() => {
    if (battle.status === "active" && battle.timeLeft > 0) {
      const timer = setInterval(() => {
        setBattle((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [battle.status, battle.timeLeft])

  // Auto-skip turn when timer reaches 0
  useEffect(() => {
    if (battle.timeLeft === 0 && battle.status === "active") {
      handleTimeOut()
    }
  }, [battle.timeLeft])

  const handleTimeOut = () => {
    setBattle((prev) => ({
      ...prev,
      currentPlayer: prev.currentPlayer === "WarriorX" ? "PlayerY" : "WarriorX",
      timeLeft: 180, // Reset to 3 minutes
      round: prev.round + 1,
      moves: [
        ...prev.moves,
        {
          player: prev.currentPlayer,
          move: "TIMEOUT",
          newNumber: prev.currentNumber,
          timestamp: "now",
        },
      ],
    }))
    setIsMyTurn(!isMyTurn)
  }

  const handleMove = () => {
    if (!moveAmount || !isMyTurn) return

    const move = Number.parseInt(moveAmount)
    let newNumber = battle.currentNumber

    if (!battle.isHidden) {
      if (mode === "strategic") {
        newNumber = Math.max(0, battle.currentNumber - move)
      } else {
        newNumber = battle.currentNumber - move
      }
    }

    setBattle((prev) => ({
      ...prev,
      currentNumber: battle.isHidden ? "???" : newNumber,
      currentPlayer: prev.currentPlayer === "WarriorX" ? "PlayerY" : "WarriorX",
      timeLeft: 180, // Reset timer
      round: prev.round + 1,
      moves: [
        ...prev.moves,
        {
          player: prev.currentPlayer,
          move: move,
          newNumber: battle.isHidden ? "???" : newNumber,
          timestamp: "now",
        },
      ],
      status: !battle.isHidden && newNumber === 0 ? "completed" : "active",
    }))

    setMoveAmount("")
    setIsMyTurn(false)

    // Check win condition for non-hidden modes
    if (!battle.isHidden && newNumber === 0) {
      // Winner logic here
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleExitBattle = () => {
    router.push("/browse")
  }

  const handleSpectateAndBet = () => {
    router.push(`/spectate/${battle.id}?mode=${mode}`)
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
                <div className="text-xs text-slate-400 font-medium">BATTLE IN PROGRESS</div>
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
                onClick={handleExitBattle}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl font-bold bg-transparent"
              >
                EXIT BATTLE
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Battle Area */}
          <div className="lg:col-span-2 space-y-6">
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
                      <p className="text-slate-300 font-medium">Battle #{battle.id}</p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      battle.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : battle.status === "completed"
                          ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    } font-bold text-lg px-4 py-2`}
                  >
                    {battle.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Current Game State */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                  BATTLE STATE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Number Display */}
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">{battle.currentNumber}</div>
                  <p className="text-slate-300 font-medium">{battle.isHidden ? "Hidden Number" : "Current Number"}</p>
                </div>

                {/* Turn Timer */}
                <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 border border-rose-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Timer className={`w-6 h-6 ${battle.timeLeft < 60 ? "text-rose-400" : "text-cyan-400"}`} />
                      <span className="font-bold text-white text-xl">{battle.currentPlayer}'s Turn</span>
                    </div>
                    <div className={`text-3xl font-black ${battle.timeLeft < 60 ? "text-rose-400" : "text-cyan-400"}`}>
                      {formatTime(battle.timeLeft)}
                    </div>
                  </div>
                  <Progress
                    value={(battle.timeLeft / 180) * 100}
                    className={`h-3 ${battle.timeLeft < 60 ? "bg-rose-900/50" : "bg-slate-800/50"}`}
                  />
                  {battle.timeLeft < 60 && (
                    <div className="flex items-center space-x-2 mt-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="text-rose-400 font-bold">TIME RUNNING OUT!</span>
                    </div>
                  )}
                </div>

                {/* Player Action Area */}
                {isMyTurn && battle.status === "active" && (
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-6">
                    <h3 className="font-bold text-cyan-400 text-xl mb-4">YOUR TURN</h3>
                    <div className="flex space-x-4">
                      <Input
                        type="number"
                        value={moveAmount}
                        onChange={(e) => setMoveAmount(e.target.value)}
                        placeholder="Enter your move"
                        className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl text-lg font-bold flex-1"
                        min="1"
                        max={mode === "quick-draw" ? "1" : battle.isHidden ? "999" : battle.currentNumber}
                      />
                      <Button
                        onClick={handleMove}
                        disabled={!moveAmount}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 rounded-xl"
                      >
                        <Swords className="w-5 h-5 mr-2" />
                        MAKE MOVE
                      </Button>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">{config.rules}</p>
                  </div>
                )}

                {!isMyTurn && battle.status === "active" && (
                  <div className="bg-gradient-to-r from-slate-800/60 to-slate-800/30 border border-slate-600/50 rounded-xl p-6 text-center">
                    <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-300 text-xl mb-2">WAITING FOR OPPONENT</h3>
                    <p className="text-slate-400">It's {battle.currentPlayer}'s turn to move</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Move History */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">BATTLE HISTORY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {battle.moves.map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            move.player === "WarriorX"
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
                        <p className="font-bold text-white">{move.move === "TIMEOUT" ? "TIMEOUT" : `-${move.move}`}</p>
                        <p className="text-sm text-slate-400">→ {move.newNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Battle Details */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">BATTLE INFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">ENTRY FEE</p>
                    <p className="font-black text-cyan-400">{battle.entryFee} ETH</p>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
                    <p className="font-black text-emerald-400">{battle.prizePool} ETH</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Round:</span>
                    <span className="font-bold text-white">
                      {battle.round}/{battle.maxRounds}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Spectators:</span>
                    <span className="font-bold text-white">{battle.spectators}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Turn Time:</span>
                    <span className="font-bold text-white">3:00 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">WARRIORS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`p-4 rounded-xl border-2 ${
                    battle.currentPlayer === battle.creator
                      ? "border-cyan-500/50 bg-cyan-900/20"
                      : "border-slate-600/50 bg-slate-900/20"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">{battle.creator[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{battle.creator}</p>
                      <p className="text-sm text-slate-400">Creator</p>
                    </div>
                  </div>
                  {battle.currentPlayer === battle.creator && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-cyan-400 font-bold text-sm">ACTIVE TURN</span>
                    </div>
                  )}
                </div>

                <div
                  className={`p-4 rounded-xl border-2 ${
                    battle.currentPlayer === battle.opponent
                      ? "border-violet-500/50 bg-violet-900/20"
                      : "border-slate-600/50 bg-slate-900/20"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-white">{battle.opponent[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{battle.opponent}</p>
                      <p className="text-sm text-slate-400">Challenger</p>
                    </div>
                  </div>
                  {battle.currentPlayer === battle.opponent && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                      <span className="text-violet-400 font-bold text-sm">ACTIVE TURN</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Spectator Actions */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">SPECTATOR ZONE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">{battle.spectators} watching</span>
                </div>

                <Button
                  onClick={handleSpectateAndBet}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  SPECTATE & BET
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-800/50 rounded-xl font-bold bg-transparent"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  SHARE BATTLE
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
