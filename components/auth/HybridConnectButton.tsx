'use client';

import { useState } from 'react';
import { SignInButton } from '@farcaster/auth-kit';
import { useAppKit } from '@reown/appkit/react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { Button } from '@/components/ui/button';
import { Wallet, User, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HybridConnectButtonProps {
  className?: string;
}

export function HybridConnectButton({ className }: HybridConnectButtonProps) {
  const { open: openAppKit } = useAppKit();
  const { 
    isFarcasterAuthenticated, 
    isWalletConnected, 
    isAuthenticated,
    farcasterProfile,
    walletAddress,
    isMiniKitConnected,
    isFrameReady
  } = useUnifiedAuth();
  
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await openAppKit();
    } catch (error) {
      console.error('Failed to open wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // If fully authenticated (Farcaster + Wallet)
  if (isAuthenticated && isWalletConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
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
            <div className="text-slate-400 text-xs">
              {isMiniKitConnected ? 'MiniKit Wallet' : truncateAddress(walletAddress)}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  // If Farcaster authenticated but no wallet - show simplified interface
  if (isFarcasterAuthenticated && !isWalletConnected) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
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
        <Button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isConnecting ? (
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Wallet className="w-4 h-4 mr-2" />
          )}
          Connect Wallet
        </Button>
      </div>
    );
  }

  // If wallet connected but no Farcaster auth
  if (isWalletConnected && !isFarcasterAuthenticated) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <div className="text-white font-medium">
              {truncateAddress(walletAddress)}
            </div>
            <div className="text-amber-400 text-xs">
              Connect Farcaster for full features
            </div>
          </div>
        </div>
        <SignInButton
          onSuccess={({ username, fid }) => {
            toast.success(`Welcome ${username}! (FID: ${fid})`);
          }}
        >
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <User className="w-4 h-4 mr-2" />
            Connect Farcaster
          </Button>
        </SignInButton>
      </div>
    );
  }

  // If neither connected - show both options
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <SignInButton
        onSuccess={({ username, fid }) => {
          toast.success(`Welcome ${username}! (FID: ${fid})`);
        }}
      >
        <Button 
          variant="outline" 
          className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white"
        >
          <User className="w-4 h-4 mr-2" />
          Connect Farcaster
        </Button>
      </SignInButton>
      
      <Button
        onClick={handleConnectWallet}
        disabled={isConnecting}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isConnecting ? (
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Wallet className="w-4 h-4 mr-2" />
        )}
        Connect Wallet
      </Button>
    </div>
  );
}
