// config/wagmiConfigSimple.ts - Simplified wagmi configuration without Farcaster connector
import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  injected,
  metaMask,
  coinbaseWallet,
} from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// Removed WalletConnect completely to avoid WebSocket errors

export const wagmiConfig = createConfig({
  chains: [baseSepolia], // Only use Base Sepolia like mintmymood
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'), // Use official Base Sepolia RPC
  },
  connectors: [
    // Farcaster Mini App connector as the primary option (like mintmymood)
    farcasterMiniApp(),
    injected({
      target: "metaMask",
    }),
    metaMask(),
    coinbaseWallet({
      appName: "ZeroSum Gaming Arena",
    }),
  ],
  ssr: false, // Disable SSR to avoid indexedDB issues
  multiInjectedProviderDiscovery: true,
});

// Export the config for use in components
export const config = wagmiConfig;
