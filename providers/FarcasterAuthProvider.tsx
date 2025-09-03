'use client';

import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { ReactNode } from 'react';


interface FarcasterAuthProviderProps {
  children: ReactNode;
}

export function FarcasterAuthProvider({ children }: FarcasterAuthProviderProps) {
  const config = {
    // Use OP Mainnet RPC for Farcaster key validation (where Farcaster contracts are deployed)
    rpcUrl: 'https://mainnet.optimism.io',
    // Use your app's domain
    domain: 'https://zerosum-arena.vercel.app',
    // Login URL for SIWE
    siweUri: 'https://zerosum-arena.vercel.app/login',
    // Farcaster relay server
    relay: 'https://relay.farcaster.xyz',
    // Chain configuration for OP Mainnet (where Farcaster contracts are deployed)
    chain: {
      id: 10,
      name: 'Optimism',
      network: 'optimism',
      nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: ['https://mainnet.optimism.io'],
        },
        public: {
          http: ['https://mainnet.optimism.io'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Optimism Explorer',
          url: 'https://optimistic.etherscan.io',
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
