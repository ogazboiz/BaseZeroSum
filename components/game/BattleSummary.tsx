"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Users, Clock, Shield, Eye, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react"
import { GameMode } from "@/hooks/useZeroSumContract"

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
  isConnected: boolean
  contractMode: GameMode
}

export default function BattleSummary({
  selectedMode,
  gameModes,
  entryFee,
  gameSettings,
  isCreating,
  onCreateBattle,
  isConnected,
  contractMode
}: BattleSummaryProps) {
  const selectedGameMode = gameModes.find((mode) => mode.id === selectedMode)
  const prizePool = entryFee[0] * 1.9 // 90% of total entry fees (95% after platform fee)
  const platformFee = entryFee[0] * 0.05 // 5% platform fee

  const getGameModeDescription = () => {
    switch (contractMode) {
      case GameMode.QUICK_DRAW:
        return {
          startRange: "15-50",
          moveRule: "Subtract exactly 1",
          winCondition: "First to reach 0 wins"
        }
      case GameMode.STRATEGIC:
        return {
          startRange: "80-200",
          moveRule: "Subtract 10-30% of current number",
          winCondition: "Force opponent to reach 0"
        }
      default:
        return {
          startRange: "Unknown",
          moveRule: "Unknown",
          winCondition: "Unknown"
        }
    }
  }

  const modeDesc = getGameModeDescription()

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl sticky top-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black text-white flex items-center">
          <Zap className="w-7 h-7 mr-3 text-yellow-400" />
          BATTLE SUMMARY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {!isConnected && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-400">WALLET NOT CONNECTED</span>
            </div>
            <p className="text-xs text-red-300">Connect your wallet to create a battle</p>
          </div>
        )}

        {isConnected && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">WALLET CONNECTED</span>
            </div>
          </div>
        )}

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
            
            {/* Contract-specific rules */}
            <div className="space-y-2 mb-3">
              <div className="text-xs text-slate-400">
                <strong>Starting Number:</strong> {modeDesc.startRange}
              </div>
              <div className="text-xs text-slate-400">
                <strong>Move Rule:</strong> {modeDesc.moveRule}
              </div>
              <div className="text-xs text-slate-400">
                <strong>Win Condition:</strong> {modeDesc.winCondition}
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
                <span className="text-slate-400">Your Entry Fee:</span>
                <span className="font-bold text-cyan-400">{entryFee[0].toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Opponent Entry Fee:</span>
                <span className="font-bold text-cyan-400">{entryFee[0].toFixed(3)} ETH</span>
              </div>
              <div className="h-px bg-slate-600"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Pool:</span>
                <span className="font-bold text-white">{(entryFee[0] * 2).toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform Fee (5%):</span>
                <span className="font-bold text-slate-400">{(platformFee * 2).toFixed(4)} ETH</span>
              </div>
              <div className="h-px bg-slate-600"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Winner Prize:</span>
                <span className="font-bold text-emerald-400">{(prizePool * 2).toFixed(3)} ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-slate-300">Turn Timeout</span>
            </div>
            <Badge variant="outline" className="border-red-500/30 text-red-400">
              {gameSettings.timeout}s
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">Private</span>
            </div>
            <Badge variant="outline" className="border-slate-500/30 text-slate-400">
              COMING SOON
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

        {/* Timeout Warning */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">TIMEOUT RULES</span>
          </div>
          <ul className="text-xs text-amber-300 space-y-1">
            <li>• 1st timeout: Turn is skipped</li>
            <li>• 2nd timeout: You lose the battle</li>
          </ul>
        </div>

        {/* Create Button */}
        <Button
          onClick={onCreateBattle}
          disabled={isCreating || !isConnected}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xl py-6 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              CREATING BATTLE...
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="w-6 h-6 mr-2" />
              CONNECT WALLET
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
          By creating this battle, you agree to our terms and conditions. The battle will start automatically when another player joins with the same entry fee.
        </p>

        {/* Smart Contract Info */}
        <div className="p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-blue-400">POWERED BY SMART CONTRACTS</span>
          </div>
          <p className="text-xs text-slate-400">
            Transparent, fair, and automatically executed on the blockchain
          </p>
        </div>
      </CardContent>
    </Card>
  )
}