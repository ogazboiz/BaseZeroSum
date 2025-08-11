"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Gamepad2, Target, Brain, Eye, Zap, Coins, Play, TrendingUp, Crown, Swords } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function SpectatePage() {
  const router = useRouter()
  const [selectedBattle, setSelectedBattle] = useState(null)
  const [betAmount, setBetAmount] = useState("0.1")
  const [selectedWarrior, setSelectedWarrior] = useState("")

  const liveBattles = [
    {
      id: 1,
      mode: "Hardcore Mystery",
      modeId: "hardcore-mystery",
      warriors: ["ShadowKiller", "DeathBringer"],
      currentNumber: "HIDDEN",
      turn: "ShadowKiller",
      round: 3,
      totalRounds: 8,
      entryFee: "0.5",
      prizePool: "0.95",
      spectators: 28,
      bettingPool: "2.4",
      odds: { ShadowKiller: 1.8, DeathBringer: 2.2 },
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgGradient: "from-rose-900/20 to-pink-900/20",
      isLive: true,
      battleState: "ShadowKiller subtracted 15. DeathBringer's turn.",
      timeLeft: "2m 15s",
    },
    {
      id: 2,
      mode: "Quick Draw",
      modeId: "quick-draw",
      warriors: ["LightningFast", "SpeedDemon"],
      currentNumber: 23,
      turn: "SpeedDemon",
      round: 12,
      totalRounds: 15,
      entryFee: "0.1",
      prizePool: "0.19",
      spectators: 12,
      bettingPool: "0.8",
      odds: { LightningFast: 2.5, SpeedDemon: 1.4 },
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      isLive: true,
      battleState: "LightningFast subtracted 1. Number is now 23.",
      timeLeft: "4m 32s",
    },
    {
      id: 3,
      mode: "Pure Mystery",
      modeId: "pure-mystery",
      warriors: ["GhostWarrior", "PhantomStrike"],
      currentNumber: "HIDDEN",
      turn: "PhantomStrike",
      round: 5,
      totalRounds: 10,
      entryFee: "0.3",
      prizePool: "0.57",
      spectators: 19,
      bettingPool: "1.2",
      odds: { GhostWarrior: 1.9, PhantomStrike: 1.9 },
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgGradient: "from-violet-900/20 to-purple-900/20",
      isLive: true,
      battleState: "GhostWarrior made a move. PhantomStrike's turn.",
      timeLeft: "1m 58s",
    },
    {
      id: 4,
      mode: "Strategic",
      modeId: "strategic",
      warriors: ["TacticalMind", "StrategyKing"],
      currentNumber: 89,
      turn: "TacticalMind",
      round: 7,
      totalRounds: 12,
      entryFee: "0.25",
      prizePool: "0.475",
      spectators: 15,
      bettingPool: "1.8",
      odds: { TacticalMind: 1.6, StrategyKing: 2.4 },
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      isLive: true,
      battleState: "StrategyKing subtracted 23%. TacticalMind's turn.",
      timeLeft: "3m 12s",
    },
  ]

  const handleWatchBattle = (battleId, modeId) => {
    router.push(`/spectate/${battleId}?mode=${modeId}`)
  }

  const handleMyBets = () => {
    router.push("/profile?tab=bets")
  }

  const handlePlaceBet = () => {
    if (!selectedWarrior || !betAmount || !selectedBattle) return

    // Simulate bet placement
    alert(`Bet placed: ${betAmount} ETH on ${selectedWarrior} in battle ${selectedBattle.id}`)
    // Reset form
    setSelectedWarrior("")
    setBetAmount("0.1")
    setSelectedBattle(null)
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
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full px-6 py-2 mb-6">
            <Eye className="w-5 h-5 text-violet-400" />
            <span className="text-violet-400 font-bold">LIVE SPECTATING</span>
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">WATCH & BET</h1>
          <p className="text-xl text-slate-300 font-medium">Witness epic battles and place your bets on the warriors</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Live Battles List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="text-3xl font-black text-white flex items-center">
                  <Play className="w-8 h-8 mr-3 text-rose-500" />
                  LIVE BATTLES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {liveBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedBattle?.id === battle.id
                          ? `bg-gradient-to-br ${battle.bgGradient} border-slate-500/50 shadow-2xl`
                          : "border-slate-700/50 hover:border-slate-600/50 bg-slate-900/40"
                      }`}
                      onClick={() => setSelectedBattle(battle)}
                    >
                      {/* Glow Effect */}
                      {selectedBattle?.id === battle.id && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${battle.gradient} opacity-10 rounded-2xl`}
                        ></div>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 bg-gradient-to-br ${battle.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                            >
                              <battle.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-white">{battle.mode}</h3>
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
                            <p className="text-sm text-slate-400 font-medium">{battle.spectators} watching</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
                            <p className="font-black text-emerald-400">{battle.prizePool} ETH</p>
                          </div>
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-400 mb-1">BETTING POOL</p>
                            <p className="font-black text-cyan-400">{battle.bettingPool} ETH</p>
                          </div>
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-400 mb-1">TIME LEFT</p>
                            <p className="font-black text-amber-400">{battle.timeLeft}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300 font-medium">
                              Round {battle.round} of {battle.totalRounds}
                            </span>
                            <span className="text-violet-400 font-bold">{battle.turn}'s turn</span>
                          </div>
                          <Progress value={(battle.round / battle.totalRounds) * 100} className="h-3 bg-slate-800/50" />
                        </div>

                        <div className="bg-gradient-to-r from-slate-800/60 to-slate-800/30 rounded-xl p-4 mb-4">
                          <p className="text-slate-300 font-medium">{battle.battleState}</p>
                          {battle.currentNumber !== "HIDDEN" && (
                            <p className="text-lg font-bold text-white mt-2">Current Number: {battle.currentNumber}</p>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-6">
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-400">{battle.warriors[0]} ODDS</p>
                              <p className="font-black text-cyan-400 text-lg">{battle.odds[battle.warriors[0]]}x</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-slate-400">{battle.warriors[1]} ODDS</p>
                              <p className="font-black text-cyan-400 text-lg">{battle.odds[battle.warriors[1]]}x</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleWatchBattle(battle.id, battle.modeId)}
                            size="sm"
                            className={`bg-gradient-to-r ${battle.gradient} hover:shadow-lg text-white rounded-xl font-bold px-6`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            WATCH BATTLE
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Betting Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-emerald-400" />
                  PLACE YOUR BET
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedBattle ? (
                  <>
                    <div
                      className={`p-4 bg-gradient-to-br ${selectedBattle.bgGradient} rounded-xl border border-slate-600/50`}
                    >
                      <h3 className="font-black text-white text-lg mb-1">{selectedBattle.mode}</h3>
                      <p className="text-slate-300 font-medium">
                        {selectedBattle.warriors[0]} vs {selectedBattle.warriors[1]}
                      </p>
                    </div>

                    <div>
                      <label className="text-lg font-bold text-white mb-4 block">CHOOSE WARRIOR</label>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedBattle.warriors.map((warrior) => (
                          <Button
                            key={warrior}
                            variant={selectedWarrior === warrior ? "default" : "outline"}
                            onClick={() => setSelectedWarrior(warrior)}
                            className={`rounded-xl p-4 h-auto flex flex-col font-bold ${
                              selectedWarrior === warrior
                                ? `bg-gradient-to-r ${selectedBattle.gradient} text-white`
                                : "border-slate-600 text-white hover:bg-slate-800/50"
                            }`}
                          >
                            <span className="text-lg">{warrior}</span>
                            <span className="text-sm opacity-75">{selectedBattle.odds[warrior]}x odds</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-lg font-bold text-white mb-4 block">BET AMOUNT (ETH)</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="bg-slate-800/50 border-slate-600/50 text-white rounded-xl text-lg font-bold h-14"
                        placeholder="0.1"
                        step="0.01"
                        min="0.01"
                      />
                    </div>

                    {selectedWarrior && betAmount && (
                      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Bet Amount:</span>
                          <span className="font-bold text-white">{betAmount} ETH</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Potential Win:</span>
                          <span className="font-black text-emerald-400 text-lg">
                            {(Number.parseFloat(betAmount) * selectedBattle.odds[selectedWarrior]).toFixed(3)} ETH
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Profit:</span>
                          <span className="font-black text-cyan-400 text-lg">
                            {(
                              Number.parseFloat(betAmount) * selectedBattle.odds[selectedWarrior] -
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
                      className={`w-full bg-gradient-to-r ${selectedBattle.gradient} hover:shadow-2xl text-white font-black text-lg py-4 rounded-xl transition-all transform hover:scale-105`}
                    >
                      <Crown className="w-6 h-6 mr-3" />
                      PLACE BET
                    </Button>

                    <p className="text-xs text-slate-400 text-center font-medium">
                      Betting closes when the battle ends
                    </p>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Swords className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">SELECT A BATTLE</h3>
                    <p className="text-slate-400 font-medium">Choose a live battle to place your bet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
