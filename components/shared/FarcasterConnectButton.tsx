"use client";

import { useAccount, useConnectors, useConnect } from "wagmi";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";

export default function FarcasterConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const connectors = useConnectors();
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);

  // Check if we're in a Farcaster Frame context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inFrame = window.location.href.includes('farcaster') || 
                     navigator.userAgent.includes('Farcaster') ||
                     window.location.href.includes('warpcast') ||
                     navigator.userAgent.includes('Warpcast') ||
                     window.location.href.includes('miniapps') ||
                     window.location.href.includes('oXpRXDCzmUMJ') ||
                     window.location.href.includes('zerosum') ||
                     window.location.search.includes('farcaster') ||
                     (window as any).farcaster ||
                     (window as any).warpcast ||
                     (window as any).miniapp ||
                     window.location.href.includes('farcaster.xyz/miniapps');
      
      setIsInFarcasterFrame(inFrame);
      
      // Auto-connect to Farcaster if in Farcaster Frame and not already connected
      if (inFrame && !isConnected) {
        const farcasterConnector = connectors.find(
          (connector) => 
            connector.id === "farcaster" || 
            connector.name?.toLowerCase().includes('farcaster') ||
            connector.name?.toLowerCase().includes('miniapp') ||
            connector.uid?.includes('farcaster')
        );
        
        if (farcasterConnector) {
          console.log('Auto-connecting to Farcaster...');
          connect({ connector: farcasterConnector });
        }
      }
    }
  }, [connectors, connect, isConnected]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-mono">
          {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
        </span>
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        // Try to connect to Farcaster first if available, otherwise show connector options
        const farcasterConnector = connectors.find(
          (connector) => 
            connector.id === "farcaster" || 
            connector.name?.toLowerCase().includes('farcaster') ||
            connector.name?.toLowerCase().includes('miniapp')
        );
        
        if (farcasterConnector) {
          connect({ connector: farcasterConnector });
        } else {
          // Fallback to first available connector
          const firstConnector = connectors[0];
          if (firstConnector) {
            connect({ connector: firstConnector });
          }
        }
      }}
      disabled={isPending}
      className="flex items-center gap-2"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
