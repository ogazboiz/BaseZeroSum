"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccount } from 'wagmi'
import { useZeroSumData } from '@/hooks/useZeroSumContract'
import { Bug, Search } from 'lucide-react'

export function SimpleDebugMyGames() {
  const { address, isConnected } = useAccount()
  const { 
    debugUserGames, 
    getUserGames,
    contractsReady 
  } = useZeroSumData()
  
  const [debugResult, setDebugResult] = useState<any>(null)
  const [isDebugging, setIsDebugging] = useState(false)

  const runDebug = async () => {
    if (!isConnected || !address) {
      console.log('❌ Wallet not connected')
      return
    }

    setIsDebugging(true)
    console.log('🚀 Starting debug session...')
    
    try {
      // Test 1: Direct getUserGames call
      console.log('🔍 Testing getUserGames directly...')
      const userGamesResult = await getUserGames(address, 0, 20)
      console.log('📊 getUserGames result:', userGamesResult)
      
      // Test 2: Full debug if available
      if (debugUserGames) {
        console.log('🔧 Running full debug...')
        const debugResult = await debugUserGames(address)
        console.log('🎯 Debug result:', debugResult)
        setDebugResult(debugResult)
      } else {
        setDebugResult({
          getUserGamesResult: userGamesResult,
          note: 'debugUserGames function not available'
        })
      }
      
    } catch (error: any) {
      console.error('❌ Debug failed:', error)
      setDebugResult({
        error: error.message,
        details: 'Check console for full error details'
      })
    } finally {
      setIsDebugging(false)
    }
  }

  if (!isConnected) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-4">
          <p className="text-red-400">Connect wallet to debug</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/60 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Bug className="w-5 h-5 text-yellow-400" />
          <span>Quick Debug - My Games Issue</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={runDebug}
            disabled={isDebugging || !contractsReady}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isDebugging ? 'Debugging...' : 'Debug My Games'}
            <Search className="w-4 h-4 ml-2" />
          </Button>
          
          <div className="text-sm text-slate-400">
            <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            <p>Contracts Ready: {contractsReady ? '✅' : '❌'}</p>
          </div>
        </div>

        {debugResult && (
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-400">Debug Results:</h4>
            
            {debugResult.error ? (
              <div className="p-3 bg-red-900/30 border border-red-500/30 rounded">
                <p className="text-red-400 font-medium">Error: {debugResult.error}</p>
                <p className="text-red-300 text-sm">{debugResult.details}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {debugResult.summary && (
                  <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded">
                    <h5 className="font-medium text-blue-400 mb-2">Summary:</h5>
                    <div className="text-sm text-blue-300 space-y-1">
                      <p>Contract Method: {debugResult.summary.contractMethod}</p>
                      <p>Manual Search: {debugResult.summary.manualSearch}</p>
                      <p>Games Checked: {debugResult.summary.gamesChecked}</p>
                    </div>
                  </div>
                )}

                {debugResult.foundGames && debugResult.foundGames.length > 0 && (
                  <div className="p-3 bg-green-900/30 border border-green-500/30 rounded">
                    <h5 className="font-medium text-green-400 mb-2">Found Games:</h5>
                    {debugResult.foundGames.map((game: any, index: number) => (
                      <div key={index} className="text-sm text-green-300 mb-1">
                        Game #{game.gameId}: Status {game.gameStatus}, Mode {game.gameMode}
                      </div>
                    ))}
                  </div>
                )}

                {debugResult.getUserGamesResult && (
                  <div className="p-3 bg-slate-700/30 border border-slate-500/30 rounded">
                    <h5 className="font-medium text-slate-300 mb-2">getUserGames Result:</h5>
                    <p className="text-sm text-slate-400">
                      Found {debugResult.getUserGamesResult.games?.length || 0} games
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={() => setDebugResult(null)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300"
            >
              Clear Results
            </Button>
          </div>
        )}

        <div className="text-xs text-slate-500">
          <p>💡 This will test both getUserGames and manual game searching</p>
          <p>📝 Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SimpleDebugMyGames