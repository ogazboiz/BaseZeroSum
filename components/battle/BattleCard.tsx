"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Eye, Play } from "lucide-react"

export interface Battle {
  id: number
  mode: string
  modeId: string
  creator: string
  entryFee: string
  prizePool: string
  timeLeft: string
  spectators: number
  difficulty: string
  icon: React.ReactNode
  gradient: string
  bgGradient: string
  isHot: boolean
  status: string
}

interface BattleCardProps {
  battle: Battle
  onJoinBattle: (battleId: number, modeId: string) => void
  onWatchBattle: (battleId: number, modeId: string) => void
}

export default function BattleCard({ battle, onJoinBattle, onWatchBattle }: BattleCardProps) {
  return (
    <Card
      className={`relative overflow-hidden bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 cursor-pointer group`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-slate-900/40"></div>

      {/* Glow Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${battle.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
      ></div>

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-14 h-14 bg-gradient-to-br ${battle.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              {battle.icon}
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white">{battle.mode}</CardTitle>
              <p className="text-sm text-slate-300 font-medium">by {battle.creator}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Hot Badge */}
            {battle.isHot && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 font-bold animate-pulse">
                <span className="mr-1">🔥</span>
                HOT
              </Badge>
            )}
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">
              {battle.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs font-bold text-slate-400 mb-1">ENTRY FEE</p>
            <p className="font-black text-cyan-400 text-lg">{battle.entryFee} ETH</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
            <p className="font-black text-emerald-400 text-lg">{battle.prizePool} ETH</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">{battle.timeLeft}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">{battle.spectators} watching</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-amber-400 font-bold">{battle.difficulty}</div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWatchBattle(battle.id, battle.modeId)}
              className="border-slate-600 text-white hover:bg-slate-800/50 rounded-lg font-bold bg-transparent hover:border-violet-500/50 transition-colors duration-300"
            >
              <Eye className="w-4 h-4 mr-1" />
              WATCH
            </Button>
            <Button
              size="sm"
              onClick={() => onJoinBattle(battle.id, battle.modeId)}
              className={`bg-gradient-to-r ${battle.gradient} hover:shadow-lg text-white rounded-lg font-bold transition-all duration-300 hover:scale-105`}
            >
              <Play className="w-4 h-4 mr-1" />
              JOIN
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
