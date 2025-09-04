"use client"

import { useState } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown } from "lucide-react"
import { toast } from "react-hot-toast"

interface WalletConnectButtonProps {
  className?: string
  showBalance?: boolean
}

export default function WalletConnectButton({ 
  className = "", 
  showBalance = false 
}: WalletConnectButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector })
      toast.success("Wallet connected successfully!")
    } catch (error: any) {
      console.error("Connection error:", error)
      toast.error("Failed to connect wallet")
    }
  }

  const handleDisconnect = () => {
    try {
      disconnect()
      toast.success("Wallet disconnected")
      setIsDropdownOpen(false)
    } catch (error: any) {
      console.error("Disconnect error:", error)
      toast.error("Failed to disconnect wallet")
    }
  }

  const truncateAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (!isConnected) {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isPending}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isPending ? "Connecting..." : "Connect Wallet"}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Choose Wallet</h3>
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className="w-full flex items-center p-2 text-left hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="w-4 h-4 text-gray-300" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {connector.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {connector.type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {truncateAddress(address!)}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="mb-3">
              <div className="text-sm font-medium text-white">
                {connector?.name || "Connected Wallet"}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {address}
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center p-2 text-left hover:bg-gray-800 rounded-md transition-colors text-red-400"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
