"use client"

import { useState, useEffect } from 'react'
import { getProvider } from '@/config/adapter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ProviderTest() {
  const [ethersProvider, setEthersProvider] = useState<any>(null)
  const [ethersChainId, setEthersChainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testProvider = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log("🧪 Testing ethers provider...")
      
      // Test Ethers Provider - Your Original Pattern!
      console.log("📡 Testing Ethers provider...")
      const provider = getProvider()
      setEthersProvider(provider)
      
      if (provider) {
        const network = await provider.getNetwork()
        setEthersChainId(Number(network.chainId))
        console.log("✅ Ethers chain ID:", network.chainId)
        console.log("✅ Network name:", network.name)
      }
      
    } catch (err: any) {
      console.error("❌ Provider test failed:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testProvider()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Ethers.js Provider Test - Your Original Pattern!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-green-400">Ethers Provider</h4>
          <p><strong>Created:</strong> {ethersProvider ? "✅ Yes" : "❌ No"}</p>
          <p><strong>Chain ID:</strong> {ethersChainId || "Loading..."}</p>
          <p><strong>Type:</strong> {ethersProvider?.constructor?.name || "None"}</p>
        </div>

        {error && <p className="text-red-500"><strong>Error:</strong> {error}</p>}

        <Button onClick={testProvider} disabled={loading}>
          {loading ? "Testing..." : "Test Ethers Provider"}
        </Button>
      </CardContent>
    </Card>
  )
}
