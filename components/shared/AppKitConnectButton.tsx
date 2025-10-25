'use client';

import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { Button } from '@/components/ui/button';
import { Wallet, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AppKitConnectButton() {
  const { address, isConnected } = useAppKitAccount();
  const { open, close } = useAppKit();
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);

  // Check if we're in a Farcaster Frame (more conservative detection)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const search = window.location.search;

      // Only detect if ACTUALLY in a Farcaster iframe/miniapp context
      const inFrame = (
        (url.includes('farcaster.xyz/miniapps') && window.parent !== window) ||
        (search.includes('farcaster=true') && window.parent !== window) ||
        ((window as any).farcaster?.isInFrame === true) ||
        ((window as any).miniapp?.isInFrame === true)
      );

      setIsInFarcasterFrame(inFrame);
      console.log('🔍 Farcaster Frame Detection:', inFrame);
    }
  }, []);

  const handleConnect = () => {
    if (isInFarcasterFrame) {
      toast.error(
        "Please use the Farcaster wallet button instead of AppKit within the Farcaster app.",
        { duration: 5000 }
      );
      return;
    }

    console.log("Opening AppKit modal for wallet connection...");
    open();
  };

  const handleDisconnect = () => {
    console.log("Disconnecting wallet...");
    close();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">
            {truncateAddress(address)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl px-6 py-3 h-12"
    >
      <Wallet className="w-5 h-5 mr-2" />
      Connect Wallet
    </Button>
  );
}