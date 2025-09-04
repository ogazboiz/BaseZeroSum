'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains';

export const appKitConfig = {
  apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'your_cdp_client_api_key',
  chain: baseSepolia,
  // Enable wallet connection modal
  enableWalletConnect: true,
  // Enable Farcaster integration
  enableFarcaster: true,
};
