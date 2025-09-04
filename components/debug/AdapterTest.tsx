"use client"

import { useState, useEffect } from 'react'
import { getProvider } from '@/config/adapter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdapterTest() {
  const [provider, setProvider] = useState<any>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAdapter = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("🧪 Testing ethers adapter directly...")
      
      const testProvider = getProvider()
      console.log("📡 Provider created:", !!testProvider)
      console.log("📡 Provider type:", testProvider?.constructor?.name)
      
      setProvider(testProvider)
      
      if (testProvider) {
        console.log("🧪 Testing provider.getNetwork()...")
        const network = await testProvider.getNetwork()
        console.log("✅ Chain ID:", network.chainId)
        console.log("✅ Network name:", network.name)
        setChainId(Number(network.chainId))
      }
      
    } catch (err: any) {
      console.error("❌ Adapter test failed:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAdapter()
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Adapter Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>Provider Created:</strong> {provider ? "✅ Yes" : "❌ No"}</p>
          <p><strong>Chain ID:</strong> {chainId || "Loading..."}</p>
          <p><strong>Provider Type:</strong> {provider?.constructor?.name || "None"}</p>
          {error && <p className="text-red-500"><strong>Error:</strong> {error}</p>}
        </div>

        <Button onClick={testAdapter} disabled={loading}>
          {loading ? "Testing..." : "Test Adapter"}
        </Button>
      </CardContent>
    </Card>
  )
}
