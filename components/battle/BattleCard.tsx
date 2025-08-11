"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Eye, Play, Target, Brain, Loader2, AlertTriangle } from "lucide-react"

// Updated interface to match your data structure
export interface Battle {
  id: number
  mode: string
  modeId: string
  creator: string
  creatorAddress: string // Add creator's wallet address for security checks
  entryFee: string
  prizePool: string
  timeLeft: string
  spectators: number
  difficulty: string
  icon?: React.ReactNode // Made optional
  iconType?: string // Added iconType support
  gradient: string
  bgGradient: string
  isHot: boolean
  status: string
}

interface BattleCardProps {
  battle: Battle
  onJoinBattle: (battleId: number, modeId: string) => void
  onWatchBattle: (battleId: number, modeId: string) => void
  isJoining: boolean // Added missing prop
  isConnected: boolean // Added missing prop
  currentUserAddress?: string // Add current user's address for creator check
}

export default function BattleCard({ 
  battle, 
  onJoinBattle, 
  onWatchBattle, 
  isJoining, 
  isConnected,
  currentUserAddress
}: BattleCardProps) {
  
  // Function to get icon - handles both icon and iconType
  const getIcon = () => {
    if (battle.icon) {
      return battle.icon
    }
    
    // Fallback to iconType string
    switch (battle.iconType) {
      case "target":
        return <Target className="w-7 h-7 text-white" />
      case "brain":
        return <Brain className="w-7 h-7 text-white" />
      case "eye":
        return <Eye className="w-7 h-7 text-white" />
      default:
        return <Eye className="w-7 h-7 text-white" />
    }
  }

  // Format ETH amounts properly
  const formatEthAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (num < 0.001) {
      return num.toFixed(6)
    } else if (num < 1) {
      return num.toFixed(4)
    } else {
      return num.toFixed(3)
    }
  }

  // Check if current user is the creator
  const isCreator = Boolean(currentUserAddress && battle.creatorAddress && 
    currentUserAddress.toLowerCase() === battle.creatorAddress.toLowerCase())

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
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-xl font-black text-white">{battle.mode}</CardTitle>
              <p className="text-sm text-slate-300 font-medium">by {battle.creator}</p>
              <p className="text-xs text-slate-400">ID: #{battle.id}</p>
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
            <p className="font-black text-cyan-400 text-lg">{formatEthAmount(battle.entryFee)} ETH</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs font-bold text-slate-400 mb-1">PRIZE POOL</p>
            <p className="font-black text-emerald-400 text-lg">{formatEthAmount(battle.prizePool)} ETH</p>
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
              disabled={!isConnected || isJoining || isCreator}
              className={`${
                isCreator
                  ? 'bg-slate-600 cursor-not-allowed'
                  : isConnected 
                    ? `bg-gradient-to-r ${battle.gradient} hover:shadow-lg` 
                    : 'bg-slate-700 cursor-not-allowed'
              } text-white rounded-lg font-bold transition-all duration-300 hover:scale-105 disabled:hover:scale-100`}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  JOINING...
                </>
              ) : isCreator ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  YOUR BATTLE
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  {isConnected ? 'JOIN' : 'CONNECT'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-xs text-center font-medium">
              Connect your wallet to join this battle
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}