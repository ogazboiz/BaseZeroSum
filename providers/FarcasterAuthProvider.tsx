'use client';

import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { ReactNode } from 'react';


interface FarcasterAuthProviderProps {
  children: ReactNode;
}

export function FarcasterAuthProvider({ children }: FarcasterAuthProviderProps) {
  const config = {
    // Use Base Sepolia RPC for testing
    rpcUrl: 'https://sepolia.base.org',
    // Use your app's domain
    domain: 'https://zerosum-arena.vercel.app',
    // Login URL for SIWE
    siweUri: 'https://zerosum-arena.vercel.app/login',
    // Farcaster relay server
    relay: 'https://relay.farcaster.xyz',
    // Chain configuration for Base Sepolia (for testing)
    chain: {
      id: 84532,
      name: 'Base Sepolia',
      network: 'base-sepolia',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: ['https://sepolia.base.org'],
        },
        public: {
          http: ['https://sepolia.base.org'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Base Sepolia Explorer',
          url: 'https://sepolia.basescan.org',
        },
      },
    },
  };

  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
