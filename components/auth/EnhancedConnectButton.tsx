'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useProfile } from '@farcaster/auth-kit';
import { Button } from '@/components/ui/button';
import { Wallet, User, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import { detectFarcasterFrame } from '@/utils/farcasterDetection';

interface EnhancedConnectButtonProps {
  className?: string;
}

export function EnhancedConnectButton({ className }: EnhancedConnectButtonProps) {
  // Wagmi hooks for Farcaster Mini App connector
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // AppKit for fallback wallets
  const { open: openAppKit } = useAppKit();
  
  // Farcaster Auth Kit
  const { isAuthenticated: isFarcasterAuthenticated, profile: farcasterProfile } = useProfile();
  
  // State
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [frameInfo, setFrameInfo] = useState(detectFarcasterFrame());
  
  // Auto-connect to Farcaster when in Farcaster Frame
  useEffect(() => {
    const attemptAutoConnect = async () => {
      if (frameInfo.isInFrame && !isConnected && !isAutoConnecting) {
        setIsAutoConnecting(true);
        
        try {
          // Find Farcaster connector
          const farcasterConnector = connectors.find(
            (connector) => 
              connector.id === "farcaster" || 
              connector.name?.toLowerCase().includes('farcaster') ||
              connector.name?.toLowerCase().includes('miniapp')
          );
          
          if (farcasterConnector) {
            await connect({ connector: farcasterConnector });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        } finally {
          setIsAutoConnecting(false);
        }
      }
    };

    attemptAutoConnect();
  }, [frameInfo.isInFrame, isConnected, isAutoConnecting, connect, connectors]);

  const handleConnectWallet = async () => {
    if (frameInfo.isInFrame) {
      // In Farcaster Frame - use Farcaster connector
      const farcasterConnector = connectors.find(
        (connector) => 
          connector.id === "farcaster" || 
          connector.name?.toLowerCase().includes('farcaster') ||
          connector.name?.toLowerCase().includes('miniapp')
      );
      
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    } else {
      // Outside Farcaster Frame - use AppKit
      openAppKit();
    }
  };

  const handleDisconnect = () => {
    if (isConnected) {
      disconnect();
    }
  };

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // Loading state
  if (isConnecting || isAutoConnecting) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button disabled className="bg-slate-600 text-white">
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {frameInfo.isInFrame ? 'Connecting to Farcaster...' : 'Connecting...'}
        </Button>
      </div>
    );
  }

  // Fully connected state
  if (isConnected && address) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Mobile: Compact button, Desktop: Full info */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            {farcasterProfile?.pfpUrl ? (
              <img 
                src={farcasterProfile.pfpUrl} 
                alt={farcasterProfile.username || 'Profile'} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="text-sm">
            <div className="text-white font-medium">
              {farcasterProfile?.username || 'Connected User'}
            </div>
            <div className="text-slate-400 text-xs">
              {frameInfo.isInFrame ? 'Farcaster Wallet' : truncateAddress(address)}
            </div>
          </div>
        </div>
        
        {/* Mobile: Just a compact connected indicator */}
        <div className="sm:hidden flex items-center space-x-1 bg-slate-800 rounded-lg px-2 py-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            {farcasterProfile?.pfpUrl ? (
              <img 
                src={farcasterProfile.pfpUrl} 
                alt={farcasterProfile.username || 'Profile'} 
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <User className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="text-xs text-slate-300">Connected</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs sm:text-sm"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    );
  }

  // Farcaster authenticated but no wallet connected
  if (isFarcasterAuthenticated && !isConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Mobile: Compact indicator, Desktop: Full info */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            {farcasterProfile?.pfpUrl ? (
              <img 
                src={farcasterProfile.pfpUrl} 
                alt={farcasterProfile.username || 'Profile'} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="text-sm">
            <div className="text-white font-medium">
              {farcasterProfile?.username || 'Farcaster User'}
            </div>
            <div className="text-cyan-400 text-xs">
              Ready to play!
            </div>
          </div>
        </div>
        
        {/* Mobile: Just a compact indicator */}
        <div className="sm:hidden flex items-center space-x-1 bg-slate-800 rounded-lg px-2 py-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            {farcasterProfile?.pfpUrl ? (
              <img 
                src={farcasterProfile.pfpUrl} 
                alt={farcasterProfile.username || 'Profile'} 
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <User className="w-3 h-3 text-white" />
            )}
          </div>
          <span className="text-xs text-cyan-300">Ready</span>
        </div>
        
        <Button
          onClick={handleConnectWallet}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm"
        >
          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>
      </div>
    );
  }

  // Not connected - show appropriate options based on context
  if (frameInfo.isInFrame) {
    // In Farcaster Frame - show Farcaster as primary option
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          onClick={handleConnectWallet}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Farcaster Wallet
          </Button>
      </div>
    );
  } else {
    // Outside Farcaster Frame - show helpful message and wallet options
  return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className="flex items-center space-x-2 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <div className="text-sm text-amber-200">
            For the best experience, open this app in Farcaster
          </div>
        </div>
        <div className="flex items-center space-x-2">
        <Button 
            onClick={handleConnectWallet}
            className="bg-slate-600 hover:bg-slate-700 text-white"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500 text-amber-300 hover:bg-amber-900/20"
            onClick={() => window.open('https://warpcast.com', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Farcaster
          </Button>
      </div>
    </div>
  );
}
}