'use client';

import { useProfile } from '@farcaster/auth-kit';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

export interface UnifiedAuthState {
  // Farcaster authentication
  isFarcasterAuthenticated: boolean;
  farcasterProfile: {
    fid?: number;
    username?: string;
    bio?: string;
    displayName?: string;
    pfpUrl?: string;
    custody?: string;
    verifications?: string[];
  } | null;
  
  // MiniKit state
  isMiniKitConnected: boolean;
  miniKitAddress: string | undefined;
  isFrameReady: boolean;
  
  // Wallet connection (fallback)
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  isAppKitConnected: boolean;
  isWagmiConnected: boolean;
  
  // Combined state
  isAuthenticated: boolean; // True if Farcaster is authenticated
  canTransact: boolean; // True if any wallet is connected (for transactions)
}

export function useUnifiedAuth(): UnifiedAuthState {
  // Farcaster authentication state
  const { isAuthenticated: isFarcasterAuthenticated, profile: farcasterProfile } = useProfile();
  
  // MiniKit context and wallet state
  const { context, isFrameReady } = useMiniKit();
  
  // AppKit wallet connection state (fallback)
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();
  
  // Wagmi wallet connection state (fallback)
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  
  // Prioritize MiniKit wallet if available, otherwise fall back to AppKit/Wagmi
  const miniKitAddress = context?.user?.address;
  const miniKitConnected = !!miniKitAddress;
  
  const isWalletConnected = miniKitConnected || appkitIsConnected || wagmiIsConnected;
  const walletAddress = miniKitAddress || appkitAddress || wagmiAddress;
  
  // Combined authentication state - if Farcaster is authenticated, that's enough for identity
  // MiniKit provides wallet abstraction, so if we have MiniKit context, we can transact
  const isAuthenticated = isFarcasterAuthenticated;
  const canTransact = isWalletConnected; // Can transact if any wallet is connected
  
  return {
    // Farcaster authentication
    isFarcasterAuthenticated,
    farcasterProfile,
    
    // MiniKit state
    isMiniKitConnected: miniKitConnected,
    miniKitAddress,
    isFrameReady,
    
    // Wallet connection (fallback)
    isWalletConnected,
    walletAddress,
    isAppKitConnected: appkitIsConnected,
    isWagmiConnected: wagmiIsConnected,
    
    // Combined state
    isAuthenticated,
    canTransact,
  };
}
