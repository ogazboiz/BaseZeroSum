// Targeted debug component specifically for Game #6 issue
// gameCounter = 7 means games 0,1,2,3,4,5,6 should exist

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useZeroSumData } from '@/hooks/useZeroSumContract'
import { useAccount } from 'wagmi'
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

const Game6DebugComponent = () => {
  const [debugResults, setDebugResults] = useState<any>(null)
  const [isDebugging, setIsDebugging] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  
  const { 
    getGame, 
    getGameCounter, 
    getPlayers, 
    getPlayerView,
    contractsReady,
    providerReady 
  } = useZeroSumData()
  
  const { address, isConnected } = useAccount()

  const debugGame6 = async () => {
    setIsDebugging(true)
    setCurrentStep('Starting comprehensive Game #6 analysis...')
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      userAddress: address,
      gameId: 6,
      steps: {},
      issues: [],
      conclusion: ''
    }

    try {
      // Step 1: Basic Setup Check
      setCurrentStep('Step 1: Checking basic setup...')
      debug.steps.basicSetup = {
        contractsReady,
        providerReady,
        userConnected: isConnected,
        userAddress: address?.slice(0, 10) + '...' + address?.slice(-6)
      }

      if (!contractsReady) debug.issues.push('❌ Contracts not ready')
      if (!providerReady) debug.issues.push('❌ Provider not ready')
      if (!isConnected) debug.issues.push('❌ Wallet not connected')

      // Step 2: Contract Connection Test
      setCurrentStep('Step 2: Testing contract connection...')
      try {
        const gameCounter = await getGameCounter()
        debug.steps.contractConnection = {
          success: true,
          gameCounter: gameCounter,
          expectedGames: `0 to ${gameCounter - 1}`,
          game6ShouldExist: gameCounter > 6
        }
        
        if (gameCounter <= 6) {
          debug.issues.push(`❌ Game #6 doesn't exist! gameCounter is ${gameCounter}, so only games 0-${gameCounter-1} exist`)
        } else {
          console.log(`✅ Game #6 should exist (gameCounter: ${gameCounter})`)
        }
      } catch (error: any) {
        debug.steps.contractConnection = {
          success: false,
          error: error.message
        }
        debug.issues.push(`❌ Contract connection failed: ${error.message}`)
      }

      // Step 3: Direct Game #6 Fetch
      if (debug.steps.contractConnection?.success && debug.steps.contractConnection?.game6ShouldExist) {
        setCurrentStep('Step 3: Attempting to fetch Game #6 directly...')
        try {
          const game6Data = await getGame(6)
          debug.steps.game6Fetch = {
            success: true,
            exists: !!game6Data,
            data: game6Data ? {
              gameId: game6Data.gameId,
              status: game6Data.status,
              mode: game6Data.mode,
              currentNumber: game6Data.currentNumber,
              currentPlayer: game6Data.currentPlayer,
              winner: game6Data.winner,
              numberGenerated: game6Data.numberGenerated,
              entryFee: game6Data.entryFee,
              prizePool: game6Data.prizePool
            } : null
          }
          
          if (!game6Data) {
            debug.issues.push('❌ Game #6 fetch returned null despite gameCounter indicating it should exist')
          } else {
            console.log('✅ Game #6 fetched successfully:', game6Data)
          }
        } catch (error: any) {
          debug.steps.game6Fetch = {
            success: false,
            error: error.message,
            errorStack: error.stack?.split('\n').slice(0, 3)
          }
          debug.issues.push(`❌ Game #6 fetch failed: ${error.message}`)
        }
      }

      // Step 4: Game #6 Players Check
      if (debug.steps.game6Fetch?.success && debug.steps.game6Fetch?.exists) {
        setCurrentStep('Step 4: Checking Game #6 players...')
        try {
          const players = await getPlayers(6)
          debug.steps.game6Players = {
            success: true,
            players: players,
            playerCount: players?.length || 0,
            playersFormatted: players?.map(p => p.slice(0, 10) + '...' + p.slice(-6)) || []
          }
          
          // Check if current user is involved
          if (address && players) {
            const userInvolved = players.some(p => p.toLowerCase() === address.toLowerCase())
            const isCreator = players[0]?.toLowerCase() === address.toLowerCase()
            
            debug.steps.game6Players.userInvolvement = {
              userInvolved,
              isCreator,
              userPosition: userInvolved ? (isCreator ? 'Creator (Player 1)' : 'Opponent (Player 2)') : 'Not involved'
            }
            
            if (!userInvolved) {
              debug.issues.push(`⚠️ You are not a player in Game #6. Players: ${debug.steps.game6Players.playersFormatted.join(', ')}`)
            } else {
              console.log(`✅ You are involved in Game #6 as ${debug.steps.game6Players.userInvolvement.userPosition}`)
            }
          }
        } catch (error: any) {
          debug.steps.game6Players = {
            success: false,
            error: error.message
          }
          debug.issues.push(`❌ Failed to get Game #6 players: ${error.message}`)
        }
      }

      // Step 5: Player View Check (if user is involved)
      if (debug.steps.game6Players?.success && debug.steps.game6Players?.userInvolvement?.userInvolved) {
        setCurrentStep('Step 5: Getting player view for Game #6...')
        try {
          const playerView = await getPlayerView(6)
          debug.steps.game6PlayerView = {
            success: true,
            data: playerView ? {
              number: playerView.number,
              yourTurn: playerView.yourTurn,
              timeLeft: playerView.timeLeft,
              yourTimeouts: playerView.yourTimeouts,
              opponentTimeouts: playerView.opponentTimeouts
            } : null
          }
        } catch (error: any) {
          debug.steps.game6PlayerView = {
            success: false,
            error: error.message,
            note: 'This might be normal for completed games'
          }
        }
      }

      // Step 6: Check other games for comparison
      setCurrentStep('Step 6: Checking other recent games for comparison...')
      const recentGamesCheck = []
      const gamesToCheck = [3, 4, 5, 6] // Check games around #6
      
      for (const gameId of gamesToCheck) {
        try {
          const gameData = await getGame(gameId)
          const players = await getPlayers(gameId)
          
          recentGamesCheck.push({
            id: gameId,
            exists: !!gameData,
            status: gameData?.status || 'unknown',
            mode: gameData?.mode || 'unknown',
            playerCount: players?.length || 0,
            userInvolved: address ? players?.some(p => p.toLowerCase() === address.toLowerCase()) : false
          })
        } catch (error) {
          recentGamesCheck.push({
            id: gameId,
            exists: false,
            error: 'Failed to fetch'
          })
        }
      }
      
      debug.steps.recentGamesComparison = recentGamesCheck

      // Generate conclusion
      if (debug.issues.length === 0) {
        if (debug.steps.game6Players?.userInvolvement?.userInvolved) {
          debug.conclusion = '✅ Game #6 exists and you are a player. The issue might be in the frontend logic.'
        } else {
          debug.conclusion = '⚠️ Game #6 exists but you are not a player in it.'
        }
      } else if (debug.issues.some(issue => issue.includes('doesn\'t exist'))) {
        debug.conclusion = '❌ Game #6 does not exist on the blockchain.'
      } else if (debug.issues.some(issue => issue.includes('fetch failed'))) {
        debug.conclusion = '❌ Game #6 should exist but cannot be fetched - possible contract or network issue.'
      } else {
        debug.conclusion = `❌ Multiple issues found: ${debug.issues.length} problems detected.`
      }

    } catch (error: any) {
      debug.steps.criticalError = {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }
      debug.conclusion = '❌ Critical error during analysis'
    }

    setDebugResults(debug)
    setIsDebugging(false)
    setCurrentStep('')
    
    // Log full results for easy copying
    console.log('🔬 GAME #6 DEBUG RESULTS:', debug)
  }

  const getStepIcon = (step: any) => {
    if (!step) return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    if (step.success === true) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (step.success === false) return <XCircle className="w-4 h-4 text-red-400" />
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
  }

  return (
    <Card className="bg-blue-500/10 border border-blue-500/30 mb-6">
      <CardHeader>
        <CardTitle className="text-blue-400 text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🎯 Game #6 Targeted Analysis</span>
            <span className="text-sm bg-blue-500/20 px-2 py-1 rounded">gameCounter: 7</span>
          </div>
          <Button 
            onClick={debugGame6}
            disabled={isDebugging}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDebugging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {currentStep || 'Analyzing...'}
              </>
            ) : (
              'Debug Game #6'
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      {debugResults && (
        <CardContent className="space-y-4">
          {/* Conclusion */}
          <div className={`p-4 rounded-lg border text-center ${
            debugResults.conclusion?.includes('✅') 
              ? 'bg-green-500/10 border-green-500/30' 
              : debugResults.conclusion?.includes('⚠️')
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className={`font-bold text-lg ${
              debugResults.conclusion?.includes('✅') 
                ? 'text-green-400' 
                : debugResults.conclusion?.includes('⚠️')
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }`}>
              {debugResults.conclusion}
            </div>
          </div>

          {/* Issues List */}
          {debugResults.issues.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
              <div className="text-red-400 font-bold mb-2">🚨 Issues Found:</div>
              <ul className="text-red-300 text-sm space-y-1">
                {debugResults.issues.map((issue: string, index: number) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps Summary */}
          <div className="bg-slate-800/40 p-3 rounded-lg">
            <div className="text-slate-300 font-bold mb-3">Analysis Steps:</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getStepIcon(debugResults.steps.basicSetup)}
                <span className="text-sm">Basic Setup Check</span>
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(debugResults.steps.contractConnection)}
                <span className="text-sm">Contract Connection & Game Counter</span>
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(debugResults.steps.game6Fetch)}
                <span className="text-sm">Game #6 Data Fetch</span>
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(debugResults.steps.game6Players)}
                <span className="text-sm">Game #6 Players Check</span>
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(debugResults.steps.game6PlayerView)}
                <span className="text-sm">Player View (if applicable)</span>
              </div>
            </div>
          </div>

          {/* Game #6 Details */}
          {debugResults.steps.game6Fetch?.success && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <div className="text-green-400 font-bold mb-2">✅ Game #6 Data:</div>
              <div className="text-green-300 text-sm space-y-1">
                <p><strong>Game ID:</strong> {debugResults.steps.game6Fetch.data?.gameId}</p>
                <p><strong>Status:</strong> {debugResults.steps.game6Fetch.data?.status}</p>
                <p><strong>Mode:</strong> {debugResults.steps.game6Fetch.data?.mode}</p>
                <p><strong>Entry Fee:</strong> {debugResults.steps.game6Fetch.data?.entryFee} ETH</p>
                <p><strong>Prize Pool:</strong> {debugResults.steps.game6Fetch.data?.prizePool} ETH</p>
                {debugResults.steps.game6Players?.success && (
                  <p><strong>Players:</strong> {debugResults.steps.game6Players.playersFormatted?.join(', ')}</p>
                )}
                {debugResults.steps.game6Players?.userInvolvement && (
                  <p><strong>Your Role:</strong> {debugResults.steps.game6Players.userInvolvement.userPosition}</p>
                )}
              </div>
            </div>
          )}

          {/* Recent Games Comparison */}
          {debugResults.steps.recentGamesComparison && (
            <div className="bg-slate-800/40 p-3 rounded-lg">
              <div className="text-slate-300 font-bold mb-2">Recent Games Comparison:</div>
              <div className="grid grid-cols-2 gap-2">
                {debugResults.steps.recentGamesComparison.map((game: any, index: number) => (
                  <div key={index} className={`text-sm p-2 rounded ${
                    game.exists ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    <div className="flex justify-between">
                      <span>Game #{game.id}:</span>
                      <span className={game.exists ? 'text-green-400' : 'text-red-400'}>
                        {game.exists ? '✅' : '❌'}
                      </span>
                    </div>
                    {game.exists && (
                      <div className="text-xs text-slate-400 mt-1">
                        {game.status} • {game.mode} • {game.playerCount} players
                        {game.userInvolved && <span className="text-yellow-400"> • You're in this game</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Debug Data */}
          <details className="bg-slate-900/40 rounded-lg">
            <summary className="p-3 cursor-pointer text-slate-300 font-medium">
              📊 Complete Debug Data (Click to expand)
            </summary>
            <div className="p-3 border-t border-slate-700">
              <pre className="text-xs text-slate-400 overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  )
}

export default Game6DebugComponent

// Add this to your BattlePage:
// <Game6DebugComponent />