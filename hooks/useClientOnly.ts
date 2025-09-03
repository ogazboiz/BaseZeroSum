import { useState, useEffect } from 'react'

/**
 * Hook to ensure components only render on the client side
 * Prevents hydration mismatches by returning false on server, true on client
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
