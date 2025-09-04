// components/debug/DirectContractReader.tsx
"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useConfig } from 'wagmi'
import { getViemClient } from '../../config/adapter'
import { getContract, formatEther } from 'viem'
import { Search, CheckCircle, XCircle } from 'lucide-react'

const CONTRACT_ADDRESS = "0x3b4B128d79cC2e0d9Af4f429A9bc74cD01bE6B7a"

// Minimal ABI for testing
const MINIMAL_ABI = [
  "function gameCounter() external view returns (uint256)",
  "function games(uint256) external view returns (uint256 gameId, uint8 mode, uint256 currentNumber, address currentPlayer, uint8 status, uint256 entryFee, uint256 prizePool, address winner, bool numberGenerated)",
  "function gamePlayers(uint256, uint256) external view returns (address)",
  "function isGameBettable(uint256) external view returns (bool)"
]

export default function DirectContractReader() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const readContract = async () => {
    setLoading(true)
    setResults(null)

    try {
      console.log('📡 Creating direct contract connection...')
      
      const client = getViemClient(config)
      if (!client) {
        throw new Error('No client available')
      }

      console.log('📡 Client network:', client.chain)
      
      const contract = getContract({
        address: CONTRACT_ADDRESS,
        abi: MINIMAL_ABI,
        client: client
      })
      console.log('📡 Contract created successfully')

      // Step 1: Read game counter
      console.log('📊 Reading gameCounter...')
      const gameCounter = await contract.read.gameCounter()
      console.log('📊 gameCounter result:', gameCounter.toString())

      const results: any = {
        gameCounter: gameCounter.toString(),
        games: []
      }

      // Step 2: Read each game
      const counterNum = parseInt(gameCounter.toString())
      for (let i = 0; i < counterNum; i++) {
        console.log(`🎮 Reading game ${i}...`)
        
        try {
          // Read game data directly
          const gameData = await contract.read.games([BigInt(i)])
          console.log(`🎮 Game ${i} raw data:`, gameData)

          // Read players
          let players = []
          try {
            const player0 = await contract.read.gamePlayers([BigInt(i), BigInt(0)])
            if (player0 !== '0x0000000000000000000000000000000000000000') {
              players.push(player0)
              
              try {
                const player1 = await contract.read.gamePlayers([BigInt(i), BigInt(1)])
                if (player1 !== '0x0000000000000000000000000000000000000000') {
                  players.push(player1)
                }
              } catch (e) {
                console.log(`No second player for game ${i}`)
              }
            }
          } catch (e) {
            console.log(`No players found for game ${i}`)
          }

          // Check if bettable
          let bettable = false
          try {
            bettable = await contract.read.isGameBettable([BigInt(i)])
          } catch (e) {
            console.log(`Could not check bettable status for game ${i}`)
          }

          const gameResult = {
            id: i,
            gameId: gameData[0].toString(),
            mode: parseInt(gameData[1].toString()),
            currentNumber: gameData[2].toString(),
            currentPlayer: gameData[3],
            status: parseInt(gameData[4].toString()),
            entryFee: formatEther(gameData[5]),
            prizePool: formatEther(gameData[6]),
            winner: gameData[7],
            numberGenerated: gameData[8],
            players: players,
            playersCount: players.length,
            bettable: bettable
          }

          results.games.push(gameResult)
          console.log(`✅ Game ${i} processed:`, gameResult)

        } catch (error: any) {
          console.error(`❌ Error reading game ${i}:`, error)
          results.games.push({
            id: i,
            error: error.message
          })
        }
      }

      setResults(results)
      console.log('✅ Direct contract read complete:', results)

    } catch (error: any) {
      console.error('❌ Direct contract read failed:', error)
      setResults({
        error: error.message,
        gameCounter: '0',
        games: []
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-yellow-500/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Search className="w-6 h-6 mr-2 text-yellow-400" />
          Direct Contract Reader
          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
            BYPASS HOOKS
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            This reads directly from the contract, bypassing all our hooks and filters to see raw blockchain data.
          </p>
        </div>

        <Button
          onClick={readContract}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Reading Contract...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Read Raw Contract Data
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Raw Contract Results
              </h3>
              
              {results.error && (
                <div className="text-red-400 mb-4 p-3 bg-red-500/10 rounded border border-red-500/30">
                  <strong>Error:</strong> {results.error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-800/50 rounded border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-400">Game Counter (Raw):</span>
                    <span className="text-2xl font-black text-green-400">{results.gameCounter}</span>
                  </div>
                </div>
                
                {results.games.length > 0 && (
                  <div>
                    <h4 className="font-bold text-white mb-3">Games Found:</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {results.games.map((game: any, index: number) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded border border-slate-600">
                          {game.error ? (
                            <div className="flex items-center text-red-400">
                              <XCircle className="w-4 h-4 mr-2" />
                              Game {game.id}: {game.error}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-cyan-400">Game {game.id}</span>
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    game.status === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                    game.status === 1 ? 'bg-green-500/20 text-green-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {game.status === 0 ? 'WAITING' : game.status === 1 ? 'ACTIVE' : 'FINISHED'}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    game.bettable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {game.bettable ? 'BETTABLE' : 'NOT BETTABLE'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><strong>Mode:</strong> {game.mode === 0 ? 'Quick Draw' : 'Strategic'}</div>
                                <div><strong>Entry Fee:</strong> {game.entryFee} ETH</div>
                                <div><strong>Prize Pool:</strong> {game.prizePool} ETH</div>
                                <div><strong>Players:</strong> {game.playersCount}/2</div>
                                <div><strong>Number Gen:</strong> {game.numberGenerated ? 'Yes' : 'No'}</div>
                                <div><strong>Current Number:</strong> {game.currentNumber}</div>
                              </div>
                              
                              {game.players.length > 0 && (
                                <div className="mt-3 text-sm">
                                  <strong>Players:</strong>
                                  {game.players.map((player: string, i: number) => (
                                    <div key={i} className="text-slate-400 font-mono">
                                      {i + 1}. {player}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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