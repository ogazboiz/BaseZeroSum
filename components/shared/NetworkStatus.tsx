"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { useClientOnly } from "@/hooks/useClientOnly"

export default function NetworkStatus() {
  const isClient = useClientOnly()
  const [isOnline, setIsOnline] = useState(true)
  const [hasNetworkError, setHasNetworkError] = useState(false)

  useEffect(() => {
    if (!isClient) return
    
    const handleOnline = () => {
      setIsOnline(true)
      setHasNetworkError(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Listen for network status changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if we're currently online
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isClient])

  // Listen for network errors from blockchain calls
  useEffect(() => {
    const handleNetworkError = (event: any) => {
      if (event.detail && event.detail.message && 
          event.detail.message.includes("network")) {
        setHasNetworkError(true)
      }
    }

    window.addEventListener('network-error', handleNetworkError)
    return () => window.removeEventListener('network-error', handleNetworkError)
  }, [])

  if (!isClient || (isOnline && !hasNetworkError)) {
    return null // Don't show anything when not client-side or when everything is working
  }

  return (
    <Badge 
      variant="destructive" 
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white"
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          OFFLINE
        </>
      ) : hasNetworkError ? (
        <>
          <AlertTriangle className="w-3 h-3 mr-1" />
          NETWORK ERROR
        </>
      ) : (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          CONNECTING...
        </>
      )}
    </Badge>
  )
}
