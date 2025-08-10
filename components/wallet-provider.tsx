"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  balance: string
  connect: () => Promise<void>
  disconnect: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState("0.00")
  const [isLoading, setIsLoading] = useState(false)

  // Check if wallet was previously connected
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet-connection')
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet)
        setIsConnected(true)
        setAddress(walletData.address)
        setBalance(walletData.balance)
      } catch (error) {
        console.error('Error parsing saved wallet data:', error)
        localStorage.removeItem('wallet-connection')
      }
    }
  }, [])

  const connect = async () => {
    setIsLoading(true)
    
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate a mock wallet address
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`
    const mockBalance = (Math.random() * 10 + 0.1).toFixed(2)
    
    setIsConnected(true)
    setAddress(mockAddress)
    setBalance(mockBalance)
    
    // Save to localStorage
    localStorage.setItem('wallet-connection', JSON.stringify({
      address: mockAddress,
      balance: mockBalance
    }))
    
    setIsLoading(false)
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    setBalance("0.00")
    localStorage.removeItem('wallet-connection')
  }

  const value: WalletContextType = {
    isConnected,
    address,
    balance,
    connect,
    disconnect,
    isLoading
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
