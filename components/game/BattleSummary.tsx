"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Flame } from "lucide-react"
import { GameMode } from "./GameModeSelector"

interface BattleSummaryProps {
  selectedGameMode: GameMode | undefined
  entryFee: number[]
  isCreating: boolean
  onCreateBattle: () => void
}

export default function BattleSummary({ 
  selectedGameMode, 
  entryFee, 
  isCreating, 
  onCreateBattle 
}: BattleSummaryProps) {
  if (!selectedGameMode) return null

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl sticky top-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black text-white flex items-center">
          <Shield className="w-6 h-6 mr-3 text-cyan-400" />
          BATTLE SUMMARY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`p-4 bg-gradient-to-br ${selectedGameMode.bgGradient} rounded-xl border border-slate-600/50`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div
              className={`w-12 h-12 bg-gradient-to-br ${selectedGameMode.gradient} rounded-xl flex items-center justify-center`}
            >
              <selectedGameMode.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">{selectedGameMode.title}</h3>
              <p className="text-sm text-slate-300">{selectedGameMode.players}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Entry Fee:</span>
            <span className="font-black text-cyan-400 text-xl">{entryFee[0]} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Prize Pool:</span>
            <span className="font-black text-emerald-400 text-xl">
              {(entryFee[0] * 2 * 0.95).toFixed(3)} ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Platform Fee:</span>
            <span className="text-slate-400">{(entryFee[0] * 2 * 0.05).toFixed(3)} ETH (5%)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Number Range:</span>
            <span className="font-bold text-violet-400">{selectedGameMode.range}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-medium">Rules:</span>
            <span className="text-sm text-slate-300">{selectedGameMode.rules}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-bold text-cyan-400 mb-1">FAIR NUMBER GENERATION</p>
              <p className="text-sm text-slate-300">
                Numbers are generated only when all players join, ensuring complete fairness.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onCreateBattle}
          disabled={isCreating}
          className={`w-full bg-gradient-to-r ${selectedGameMode.gradient} hover:shadow-2xl text-white font-black text-lg py-4 rounded-xl transition-all transform hover:scale-105`}
          size="lg"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              CREATING BATTLE...
            </>
          ) : (
            <>
              <Flame className="w-6 h-6 mr-3" />
              CREATE BATTLE
            </>
          )}
        </Button>

        <p className="text-xs text-slate-400 text-center font-medium">
          You'll pay the entry fee when someone joins your battle
        </p>
      </CardContent>
    </Card>
  )
}
