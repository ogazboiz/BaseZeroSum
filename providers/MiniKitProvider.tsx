'use client';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { ReactNode } from 'react';
import { base, baseSepolia } from 'wagmi/chains';

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  // Use Base Sepolia for testnet, Base for mainnet
  const chain = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet' ? base : baseSepolia;
  
  return (
    <MiniKitProvider apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY} chain={chain}>
      {children}
    </MiniKitProvider>
  );
}