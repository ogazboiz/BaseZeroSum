"use client"

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useConfig, useChainId } from 'wagmi'
import { getViemClient } from '@/config/adapter'
import { formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BalanceTest() {
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const config = useConfig()
  const chainId = useChainId()
  
  // Current chain ID
  const currentChainId = chainId
  
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBalance = async () => {
    if (!address) {
      addLog("❌ No address available")
      return
    }

    setLoading(true)
    addLog(`🔄 Testing balance for: ${address}`)

    try {
      // Test 1: Using publicClient directly (it's already on the correct chain)
      addLog("📡 Testing with publicClient...")
      if (publicClient) {
        addLog(`📡 Public client chain: ${publicClient.chain?.name} (${publicClient.chain?.id})`)
        addLog(`📡 Public client RPC: ${publicClient.transport?.url || 'Unknown'}`)
        addLog(`📡 Your wallet chain: ${currentChainId}`)
        
        // Use publicClient directly since it's already on the correct chain
        const balance1 = await publicClient.getBalance({ address: address as `0x${string}` })
        addLog(`💰 Balance on chain ${currentChainId}: ${formatEther(balance1)} MNT`)
        setBalance(formatEther(balance1))
      } else {
        addLog("❌ No public client available")
      }

      // Test 2: Using getViemClient with correct chain
      addLog("📡 Testing with getViemClient for your chain...")
      if (config) {
        const client = getViemClient(config, { chainId: currentChainId })
        if (client) {
          addLog(`📡 Config client chain: ${client.chain?.name} (${client.chain?.id})`)
          addLog(`📡 Config client RPC: ${client.transport?.url || 'Unknown'}`)
          const balance2 = await client.getBalance({ address: address as `0x${string}` })
          addLog(`💰 Config client balance: ${formatEther(balance2)} MNT`)
          setBalance(formatEther(balance2))
        } else {
          addLog("❌ No config client available for your chain")
        }
      } else {
        addLog("❌ No config available")
      }

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      console.error("Balance test error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Balance Test Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Connected:</strong> Loading...</p>
            <p><strong>Address:</strong> Loading...</p>
            <p><strong>Chain ID:</strong> Loading...</p>
            <p><strong>Network:</strong> Loading...</p>
            <p><strong>Public Client:</strong> Loading...</p>
            <p><strong>Config:</strong> Loading...</p>
            <p><strong>Current Balance:</strong> Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Balance Test Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>Connected:</strong> {isConnected ? "✅ Yes" : "❌ No"}</p>
          <p><strong>Address:</strong> {address || "None"}</p>
          <p><strong>Chain ID:</strong> {currentChainId || "Unknown"}</p>
          <p><strong>Network:</strong> {currentChainId === 8453 ? "Base Mainnet" : currentChainId === 84532 ? "Base Sepolia Testnet" : "Unknown"}</p>
          <p><strong>Public Client:</strong> {publicClient ? "✅ Available" : "❌ Not available"}</p>
          <p><strong>Config:</strong> {config ? "✅ Available" : "❌ Not available"}</p>
          <p><strong>Current Balance:</strong> {balance} ETH</p>
        </div>

        <Button onClick={testBalance} disabled={loading || !address}>
          {loading ? "Testing..." : "Test Balance"}
        </Button>

        <div className="space-y-2">
          <h3 className="font-semibold">Logs:</h3>
          <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
