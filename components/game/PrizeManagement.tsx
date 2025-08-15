// components/game/PrizeManagement.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Coins, 
  ArrowDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Wallet,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { GameState } from '@/hooks/useGameState'

interface PrizeManagementProps {
  gameState: GameState
  userBalance: string
  canWithdraw: boolean
  onWithdraw: () => Promise<boolean>
  isLoading?: boolean
}

export function PrizeManagement({ 
  gameState, 
  userBalance, 
  canWithdraw, 
  onWithdraw,
  isLoading = false
}: PrizeManagementProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    try {
      const success = await onWithdraw()
      if (success) {
        toast.success('💰 Winnings withdrawn successfully!')
      }
    } catch (error) {
      toast.error('Failed to withdraw winnings')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const formatETH = (amount: string) => {
    return `${parseFloat(amount).toFixed(4)} ETH`
  }

  const getPrizeStatus = () => {
    if (gameState.status === 'waiting') {
      return {
        icon: Clock,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        title: 'Prize Pool Building',
        description: 'Waiting for opponent to join'
      }
    }
    
    if (gameState.status === 'active') {
      return {
        icon: Trophy,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        title: 'Battle in Progress',
        description: 'Winner takes all prize pool'
      }
    }
    
    if (gameState.hasWon) {
      return {
        icon: Trophy,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        title: '🎉 YOU WON!',
        description: 'Congratulations! Claim your winnings'
      }
    }
    
    return {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      title: 'Game Completed',
      description: 'Better luck next time!'
    }
  }

  const prizeStatus = getPrizeStatus()
  const IconComponent = prizeStatus.icon

  return (
    <div className="space-y-6">
      {/* Prize Pool Status */}
      <Card className={`${prizeStatus.bgColor} ${prizeStatus.borderColor} border hidden`}>
        <CardHeader>
          <CardTitle className={`${prizeStatus.color} flex items-center text-xl font-black`}>
            <IconComponent className="w-6 h-6 mr-3" />
            {prizeStatus.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`${prizeStatus.color} font-medium`}>
            {prizeStatus.description}
          </p>
          
          {/* Prize Pool Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/40 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Total Prize Pool</span>
              </div>
              <div className="text-2xl font-black text-white">
                {formatETH(gameState.prizePool)}
              </div>
            </div>
            
            <div className="bg-slate-800/40 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Entry Fee</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {formatETH(gameState.entryFee)}
              </div>
              <div className="text-xs text-slate-400">per player</div>
            </div>
            
            <div className="bg-slate-800/40 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-slate-300">Platform Fee</span>
              </div>
              <div className="text-xl font-bold text-violet-400">
                {gameState.platformFee}%
              </div>
              <div className="text-xs text-slate-400">
                ~{formatETH((parseFloat(gameState.prizePool) * gameState.platformFee / 100).toString())}
              </div>
            </div>
          </div>

          {/* Winner Prize Calculation */}
          {gameState.status === 'completed' && (
            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-600/30">
              <h4 className="text-white font-bold mb-3">💰 Prize Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total Prize Pool:</span>
                  <span className="text-white font-bold">{formatETH(gameState.prizePool)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Platform Fee ({gameState.platformFee}%):</span>
                  <span className="text-red-400">
                    -{formatETH((parseFloat(gameState.prizePool) * gameState.platformFee / 100).toString())}
                  </span>
                </div>
                <hr className="border-slate-600" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Winner Receives:</span>
                  <span className="text-emerald-400 font-black text-lg">
                    {formatETH((parseFloat(gameState.prizePool) * (100 - gameState.platformFee) / 100).toString())}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Balance & Withdrawal */}
      {parseFloat(userBalance) > 0 && (
        <Card className="bg-emerald-900/20 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center text-xl font-black">
              <Wallet className="w-6 h-6 mr-3" />
              YOUR WINNINGS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-4xl font-black text-emerald-400 mb-2">
                {formatETH(userBalance)}
              </div>
              <p className="text-emerald-300 font-medium">
                Available to withdraw
              </p>
            </div>

            {canWithdraw && (
              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl text-lg"
              >
                {isWithdrawing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Withdrawing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>WITHDRAW {formatETH(userBalance)}</span>
                  </div>
                )}
              </Button>
            )}

            {!canWithdraw && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-400 font-medium">
                    Withdrawal temporarily unavailable. Please try again later.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Winnings (if game just ended) */}
      {gameState.hasWon && parseFloat(gameState.pendingWinnings) > 0 && parseFloat(userBalance) === 0 && (
        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center text-xl font-black">
              <Clock className="w-6 h-6 mr-3" />
              PROCESSING WINNINGS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div className="text-3xl font-black text-amber-400 mb-2">
                {formatETH(gameState.pendingWinnings)}
              </div>
              <p className="text-amber-300 font-medium">
                Being processed to your balance
              </p>
            </div>
            
            <div className="p-4 bg-slate-800/40 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Game Completed</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-amber-400 font-medium">Processing Prize...</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">Updating Balance...</span>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm text-center">
              Your winnings will appear in your balance within a few minutes. 
              Refresh the page if it takes longer than expected.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Winnings Message */}
      {gameState.status === 'completed' && !gameState.hasWon && parseFloat(userBalance) === 0 && (
        <Card className="bg-slate-800/40 border-slate-600/50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Game Completed</h3>
            <p className="text-slate-400 mb-4">
              {gameState.winner ? `${gameState.winner === gameState.creator ? 'Creator' : 'Opponent'} won this round` : 'No winner determined'}
            </p>
            <div className="text-slate-300">
              <p>Prize Pool: <span className="text-white font-bold">{formatETH(gameState.prizePool)}</span></p>
              <p className="text-sm text-slate-400 mt-2">Better luck in your next battle!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}