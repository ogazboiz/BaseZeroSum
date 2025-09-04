"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccount } from "wagmi"
import { useZeroSumData } from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function DebugPage() {
  const { address, isConnected } = useAccount()
  const { getGameCounter, getGame, contractsReady, providerReady } = useZeroSumData()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runDebug = async () => {
    setIsLoading(true)
    const info: any = {}

    try {
      console.log("🔍 Running debug checks...")
      
      // Check connection
      info.connection = {
        isConnected,
        address,
        contractsReady,
        providerReady
      }

      // Check game counter
      try {
        const counter = await getGameCounter()
        info.gameCounter = counter
        console.log("📊 Game counter:", counter)
      } catch (error) {
        info.gameCounterError = error instanceof Error ? error.message : String(error)
        console.error("❌ Game counter error:", error)
      }

      // Check specific games
      for (let i = 1; i <= 10; i++) {
        try {
          const game = await getGame(i)
          info[`game${i}`] = game ? "EXISTS" : "NULL"
          if (game) {
            info[`game${i}Details`] = {
              status: game.status,
              mode: game.mode,
              entryFee: game.entryFee
            }
          }
        } catch (error) {
          info[`game${i}Error`] = error instanceof Error ? error.message : String(error)
        }
      }

      setDebugInfo(info)
    } catch (error) {
      console.error("❌ Debug error:", error)
      info.debugError = error instanceof Error ? error.message : String(error)
      setDebugInfo(info)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && contractsReady) {
      runDebug()
    }
  }, [isConnected, contractsReady])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <UnifiedGamingNavigation />
      
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">🔍 Contract Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runDebug} 
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoading ? "Running Debug..." : "Run Debug Check"}
            </Button>

            <div className="bg-slate-900/40 rounded-lg p-4">
              <pre className="text-xs text-green-400 overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
