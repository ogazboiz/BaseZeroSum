"use client"

import { ReactNode } from "react"
import { useWallet } from "./wallet-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Shield, Lock } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isConnected, connect, isLoading } = useWallet()

  if (isConnected) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-center p-4">
      <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-white">Wallet Required</CardTitle>
          <p className="text-slate-300 text-sm">
            Connect your wallet to access this feature
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-slate-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Protected Feature</span>
            </div>
            <p className="text-xs text-slate-400">
              This action requires wallet authentication for security and transaction signing.
            </p>
          </div>
          
          <Button
            onClick={connect}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isLoading ? "CONNECTING..." : "CONNECT WALLET"}
          </Button>
          
          <p className="text-xs text-slate-400 mt-4">
            Your wallet connection is required for:
          </p>
          <ul className="text-xs text-slate-400 mt-2 space-y-1">
            <li>• Creating battles and tournaments</li>
            <li>• Joining games</li>
            <li>• Accessing your profile</li>
            <li>• Managing staking</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
