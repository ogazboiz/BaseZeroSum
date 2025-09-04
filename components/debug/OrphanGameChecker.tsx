// components/debug/OrphanGameChecker.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useConfig } from 'wagmi'

import { getEthersProvider } from '@/config/adapter'
import { Search, AlertTriangle } from 'lucide-react'

const CONTRACT_ADDRESS = "0x3b4B128d79cC2e0d9Af4f429A9bc74cD01bE6B7a"

const GAMES_ABI = [
  "function games(uint256) external view returns (uint256 gameId, uint8 mode, uint256 currentNumber, address currentPlayer, uint8 status, uint256 entryFee, uint256 prizePool, address winner, bool numberGenerated)",
  "function gamePlayers(uint256, uint256) external view returns (address)",
  "function gameCounter() external view returns (uint256)"
]

export default function OrphanGameChecker() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const checkOrphanGames = async () => {
    setLoading(true)
    setResults(null)

    try {
      const provider = getEthersProvider(config)
      if (!provider) throw new Error('No provider available')

      const contract = new ethers.Contract(CONTRACT_ADDRESS, GAMES_ABI, provider)
      
      // Check gameCounter first
      const gameCounter = await contract.gameCounter()
      console.log('📊 Official gameCounter:', gameCounter.toString())

      const results: any = {
        gameCounter: gameCounter.toString(),
        orphanGames: [],
        emptySlots: []
      }

      // Check game IDs 0-10 regardless of gameCounter
      console.log('🔍 Scanning for orphan games (IDs 0-10)...')
      
      for (let i = 0; i <= 10; i++) {
        try {
          const gameData = await contract.games(i)
          
          // Check if game exists (gameId > 0 or entryFee > 0)
          const gameExists = gameData[0] > 0 || gameData[5] > 0 // gameId > 0 OR entryFee > 0
          
          if (gameExists) {
            console.log(`✅ Found game at ID ${i}:`, gameData)
            
            // Get players
            let players = []
            try {
              const player0 = await contract.gamePlayers(i, 0)
              if (player0 !== ethers.ZeroAddress) {
                players.push(player0)
                try {
                  const player1 = await contract.gamePlayers(i, 1)
                  if (player1 !== ethers.ZeroAddress) {
                    players.push(player1)
                  }
                } catch (e) {
                  // No second player
                }
              }
            } catch (e) {
              // No players
            }

            const gameInfo = {
              id: i,
              gameId: gameData[0].toString(),
              mode: parseInt(gameData[1].toString()),
              currentNumber: gameData[2].toString(),
              currentPlayer: gameData[3],
              status: parseInt(gameData[4].toString()),
              entryFee: ethers.formatEther(gameData[5]),
              prizePool: ethers.formatEther(gameData[6]),
              winner: gameData[7],
              numberGenerated: gameData[8],
              players: players,
              playersCount: players.length,
              isOrphan: i >= parseInt(gameCounter.toString()) // Orphan if ID >= gameCounter
            }

            if (gameInfo.isOrphan) {
              results.orphanGames.push(gameInfo)
            }
            
          } else {
            console.log(`❌ Empty slot at ID ${i}`)
            results.emptySlots.push(i)
          }
          
        } catch (error) {
          console.log(`❌ Error checking ID ${i}:`, error)
          results.emptySlots.push(i)
        }
      }

      setResults(results)
      console.log('🎯 Orphan check complete:', results)

    } catch (error: any) {
      console.error('❌ Orphan check failed:', error)
      setResults({
        error: error.message,
        gameCounter: '0',
        orphanGames: [],
        emptySlots: []
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-orange-500/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-orange-400" />
          Orphan Game Detective
          <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
            FINDS MISSING GAMES
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-200 text-sm">
            <strong>Theory:</strong> Your games exist but gameCounter wasn't incremented. 
            This will scan game slots 0-10 to find orphaned games.
          </p>
        </div>

        <Button
          onClick={checkOrphanGames}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Scanning for Orphans...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Missing Games
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">🕵️ Investigation Results</h3>
              
              {results.error && (
                <div className="text-red-400 mb-4 p-3 bg-red-500/10 rounded border border-red-500/30">
                  <strong>Error:</strong> {results.error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-800/50 rounded border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400">Official Game Counter:</span>
                    <span className="text-2xl font-black text-blue-400">{results.gameCounter}</span>
                  </div>
                </div>

                {results.orphanGames.length > 0 && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded">
                    <h4 className="font-bold text-orange-400 mb-3">
                      🔍 ORPHAN GAMES FOUND: {results.orphanGames.length}
                    </h4>
                    <div className="space-y-3">
                      {results.orphanGames.map((game: any, index: number) => (
                        <div key={index} className="p-3 bg-slate-800/50 rounded border border-orange-500/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-orange-400">Game {game.id} (ORPHAN)</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              game.status === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              game.status === 1 ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {game.status === 0 ? 'WAITING' : game.status === 1 ? 'ACTIVE' : 'FINISHED'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Mode:</strong> {game.mode === 0 ? 'Quick Draw' : 'Strategic'}</div>
                            <div><strong>Entry Fee:</strong> {game.entryFee} ETH</div>
                            <div><strong>Prize Pool:</strong> {game.prizePool} ETH</div>
                            <div><strong>Players:</strong> {game.playersCount}/2</div>
                          </div>

                          <div className="mt-2 p-2 bg-orange-500/20 rounded text-xs text-orange-200">
                            <strong>🎯 SOLUTION:</strong> This game exists but your browse page won't find it 
                            because gameCounter ({results.gameCounter}) doesn't include it!
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.orphanGames.length === 0 && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-center">
                    <span className="text-green-400">No orphan games found. The issue might be elsewhere.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}