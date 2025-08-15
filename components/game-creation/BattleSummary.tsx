"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Users, Clock, Shield, Eye } from "lucide-react"

interface BattleSummaryProps {
  selectedMode: string
  gameModes: any[]
  entryFee: number[]
  gameSettings: {
    isPrivate: boolean
    allowSpectators: boolean
    timeout: number
  }
  isCreating: boolean
  onCreateBattle: () => void
}

export default function BattleSummary({ selectedMode, gameModes, entryFee, gameSettings, isCreating, onCreateBattle }: BattleSummaryProps) {
  const selectedGameMode = gameModes.find((mode) => mode.id === selectedMode)
  const prizePool = entryFee[0] * 1.9 // 90% of total entry fees

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl sticky top-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black text-white flex items-center">
          <Zap className="w-7 h-7 mr-3 text-yellow-400" />
          BATTLE SUMMARY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Mode Info */}
        {selectedGameMode && (
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${selectedGameMode.gradient} rounded-xl flex items-center justify-center`}
              >
                <selectedGameMode.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedGameMode.title}</h3>
                <p className="text-sm text-slate-400">{selectedGameMode.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2">
                <div className="text-xs font-bold text-slate-400">DIFFICULTY</div>
                <div className="font-bold text-amber-400">{selectedGameMode.difficulty}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2">
                <div className="text-xs font-bold text-slate-400">DURATION</div>
                <div className="font-bold text-white">{selectedGameMode.avgDuration}</div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Info */}
        <div className="space-y-4">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-lg font-bold text-white mb-3">FINANCIAL DETAILS</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Entry Fee:</span>
                <span className="font-bold text-cyan-400">{entryFee[0]} MNT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Prize Pool:</span>
                <span className="font-bold text-emerald-400">{prizePool.toFixed(2)} MNT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform Fee:</span>
                <span className="font-bold text-slate-400">0.01 MNT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-slate-300">Timeout</span>
            </div>
            <Badge variant="outline" className="border-red-500/30 text-red-400">
              {gameSettings.timeout}s
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Private</span>
            </div>
            <Badge variant={gameSettings.isPrivate ? "default" : "outline"} className={gameSettings.isPrivate ? "bg-green-500" : ""}>
              {gameSettings.isPrivate ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">Spectators</span>
            </div>
            <Badge variant={gameSettings.allowSpectators ? "default" : "outline"} className={gameSettings.allowSpectators ? "bg-blue-500" : ""}>
              {gameSettings.allowSpectators ? "ALLOWED" : "BLOCKED"}
            </Badge>
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={onCreateBattle}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xl py-6 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              CREATING BATTLE...
            </>
          ) : (
            <>
              <Zap className="w-6 h-6 mr-2" />
              CREATE BATTLE
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-slate-400 text-center">
          By creating this battle, you agree to our terms and conditions. The battle will start once another player joins.
        </p>
      </CardContent>
    </Card>
  )
}
