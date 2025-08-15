// Add this debug component to your battle page to diagnose the issue

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useZeroSumData } from '@/hooks/useZeroSumContract'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DebugPlayerDetectionProps {
  gameId: string | number
}

export function DebugPlayerDetection({ gameId }: DebugPlayerDetectionProps) {
  const { address, isConnected } = useAccount()
  const { getGame, getPlayers } = useZeroSumData()
  const [debugData, setDebugData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runDebugCheck = async () => {
    if (!gameId || !address) return

    setIsLoading(true)
    const debug: any = {
      timestamp: new Date().toISOString(),
      gameId,
      connectedAddress: address,
      isConnected,
      steps: []
    }

    try {
      // Step 1: Get game data
      debug.steps.push('Fetching game data...')
      const gameData = await getGame(Number(gameId))
      debug.gameData = gameData
      debug.steps.push(`Game data: ${gameData ? 'Found' : 'Not found'}`)

      if (!gameData) {
        debug.error = 'Game data not found'
        setDebugData(debug)
        setIsLoading(false)
        return
      }

      // Step 2: Get players
      debug.steps.push('Fetching players...')
      const players = await getPlayers(Number(gameId))
      debug.players = players
      debug.steps.push(`Players: ${players.length} found`)

      // Step 3: Address comparison
      debug.addressComparison = {
        connectedAddress: address.toLowerCase(),
        players: players.map(p => ({
          original: p,
          lowercase: p.toLowerCase(),
          matches: p.toLowerCase() === address.toLowerCase()
        }))
      }

      // Step 4: Player detection logic
      const normalizedAddress = address.toLowerCase()
      const normalizedPlayers = players.map(p => p.toLowerCase())
      
      debug.playerDetection = {
        isInGame: normalizedPlayers.includes(normalizedAddress),
        isCreator: normalizedPlayers.length > 0 && normalizedPlayers[0] === normalizedAddress,
        isOpponent: normalizedPlayers.length > 1 && normalizedPlayers[1] === normalizedAddress,
        playerIndex: normalizedPlayers.indexOf(normalizedAddress)
      }

      debug.steps.push('Player detection complete')

    } catch (error) {
      debug.error = error instanceof Error ? error.message : String(error)
      debug.steps.push(`Error: ${debug.error}`)
    }

    setDebugData(debug)
    setIsLoading(false)
  }

  useEffect(() => {
    if (gameId && address) {
      runDebugCheck()
    }
  }, [gameId, address])

  return (
    <Card className="mb-6 bg-orange-900/20 border border-orange-500/30">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center justify-between">
          🔍 Player Detection Debug
          <Button
            onClick={runDebugCheck}
            size="sm"
            variant="outline"
            className="border-orange-500/30 text-orange-400"
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Recheck'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(debugData).length === 0 ? (
          <p className="text-slate-400">Click "Recheck" to run debug analysis</p>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-3 rounded-lg">
                <h4 className="font-bold text-white mb-2">Game Info</h4>
                <div className="text-sm space-y-1">
                  <div>Game ID: <span className="text-cyan-400">{debugData.gameId}</span></div>
                  <div>Timestamp: <span className="text-slate-300">{debugData.timestamp}</span></div>
                  <div>Connected: <span className={debugData.isConnected ? 'text-emerald-400' : 'text-red-400'}>
                    {debugData.isConnected ? 'Yes' : 'No'}
                  </span></div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-lg">
                <h4 className="font-bold text-white mb-2">Your Address</h4>
                <div className="text-xs font-mono text-cyan-400 break-all">
                  {debugData.connectedAddress}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-slate-800/40 p-3 rounded-lg">
              <h4 className="font-bold text-white mb-2">Debug Steps</h4>
              <div className="space-y-1">
                {debugData.steps?.map((step: string, index: number) => (
                  <div key={index} className="text-sm text-slate-300">
                    {index + 1}. {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Players */}
            {debugData.players && (
              <div className="bg-slate-800/40 p-3 rounded-lg">
                <h4 className="font-bold text-white mb-2">Players Found ({debugData.players.length})</h4>
                <div className="space-y-2">
                  {debugData.players.map((player: string, index: number) => (
                    <div key={index} className="bg-slate-700/40 p-2 rounded text-sm">
                      <div className="font-medium text-white">
                        Player {index + 1} {index === 0 ? '(Creator)' : '(Opponent)'}
                      </div>
                      <div className="font-mono text-xs text-slate-300 break-all">{player}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Comparison */}
            {debugData.addressComparison && (
              <div className="bg-slate-800/40 p-3 rounded-lg">
                <h4 className="font-bold text-white mb-2">Address Comparison</h4>
                <div className="space-y-2">
                  <div className="bg-slate-700/40 p-2 rounded text-sm">
                    <div className="text-cyan-400 font-medium">Your Address (lowercase):</div>
                    <div className="font-mono text-xs break-all">{debugData.addressComparison.connectedAddress}</div>
                  </div>
                  {debugData.addressComparison.players.map((player: any, index: number) => (
                    <div key={index} className="bg-slate-700/40 p-2 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Player {index + 1}:</span>
                        <span className={`font-bold ${player.matches ? 'text-emerald-400' : 'text-red-400'}`}>
                          {player.matches ? '✅ MATCH' : '❌ NO MATCH'}
                        </span>
                      </div>
                      <div className="font-mono text-xs break-all">{player.lowercase}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Detection Results */}
            {debugData.playerDetection && (
              <div className="bg-slate-800/40 p-3 rounded-lg">
                <h4 className="font-bold text-white mb-2">Player Detection Results</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-2 rounded text-center ${
                    debugData.playerDetection.isInGame ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <div className="font-bold">IN GAME</div>
                    <div className="text-sm">{debugData.playerDetection.isInGame ? 'YES' : 'NO'}</div>
                  </div>
                  <div className={`p-2 rounded text-center ${
                    debugData.playerDetection.isCreator ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    <div className="font-bold">IS CREATOR</div>
                    <div className="text-sm">{debugData.playerDetection.isCreator ? 'YES' : 'NO'}</div>
                  </div>
                  <div className={`p-2 rounded text-center ${
                    debugData.playerDetection.isOpponent ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    <div className="font-bold">IS OPPONENT</div>
                    <div className="text-sm">{debugData.playerDetection.isOpponent ? 'YES' : 'NO'}</div>
                  </div>
                  <div className="p-2 rounded text-center bg-slate-500/20 text-slate-300">
                    <div className="font-bold">PLAYER INDEX</div>
                    <div className="text-sm">{debugData.playerDetection.playerIndex}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {debugData.error && (
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
                <h4 className="font-bold text-red-400 mb-2">Error</h4>
                <div className="text-sm text-red-300">{debugData.error}</div>
              </div>
            )}

            {/* Raw Data */}
            <details className="bg-slate-800/40 p-3 rounded-lg">
              <summary className="font-bold text-white cursor-pointer mb-2">Raw Debug Data</summary>
              <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-900/40 p-2 rounded">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}