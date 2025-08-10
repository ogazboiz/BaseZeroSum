"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown } from "lucide-react"

export interface GameMode {
  id: string
  title: string
  subtitle: string
  description: string
  players: string
  difficulty: string
  icon: any
  gradient: string
  bgGradient: string
  range: string
  rules: string
  avgDuration: string
}

interface GameModeSelectorProps {
  gameModes: GameMode[]
  selectedMode: string
  onModeSelect: (modeId: string) => void
}

export default function GameModeSelector({ gameModes, selectedMode, onModeSelect }: GameModeSelectorProps) {
  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl mb-8">
      <CardHeader>
        <CardTitle className="text-3xl font-black text-white flex items-center">
          <Crown className="w-8 h-8 mr-3 text-amber-400" />
          SELECT GAME MODE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {gameModes.map((mode) => (
            <div
              key={mode.id}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedMode === mode.id
                  ? `bg-gradient-to-br ${mode.bgGradient} border-slate-500/50 shadow-2xl`
                  : "border-slate-700/50 hover:border-slate-600/50 bg-slate-900/40"
              }`}
              onClick={() => onModeSelect(mode.id)}
            >
              {/* Glow Effect */}
              {selectedMode === mode.id && (
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${mode.gradient} opacity-10 rounded-2xl`}
                ></div>
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${mode.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <mode.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 mb-1">{mode.subtitle}</div>
                    <div className="text-amber-400 font-bold">{mode.difficulty}</div>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2">{mode.title}</h3>
                <p className="text-slate-300 font-medium mb-4">{mode.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-xs font-bold text-slate-400">PLAYERS</div>
                    <div className="font-bold text-white">{mode.players}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-xs font-bold text-slate-400">DURATION</div>
                    <div className="font-bold text-white">{mode.avgDuration}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
