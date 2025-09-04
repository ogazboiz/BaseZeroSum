// config/wagmiConfig.ts - Farcaster-compatible wagmi configuration
import { createConfig, http } from "wagmi";
import { mantle, mantleSepoliaTestnet } from "wagmi/chains";
import {
  injected,
  walletConnect,
  metaMask,
  coinbaseWallet,
} from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// Get projectId from environment variable
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '1922d8f34388fb1c3b3553c342d31094';

// Create WalletConnect connector only once
let walletConnectConnector: any = null;

const getWalletConnectConnector = () => {
  if (!walletConnectConnector) {
    walletConnectConnector = walletConnect({
      projectId,
      metadata: {
        name: "ZeroSum Gaming Arena",
        description: "Mathematical warfare where strategy beats luck. Privacy-fixed games with hidden numbers and true fairness.",
        url: "https://zerosum.arena",
        icons: ["https://zerosum.arena/logo.png"],
      },
    });
  }
  return walletConnectConnector;
};

export const wagmiConfig = createConfig({
  chains: [mantle, mantleSepoliaTestnet],
  transports: {
    [mantle.id]: http(),
    [mantleSepoliaTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
  connectors: [
    // Farcaster Mini App connector as the primary option
    farcasterMiniApp(),
    injected({
      target: "metaMask",
    }),
    metaMask(),
    coinbaseWallet({
      appName: "ZeroSum Gaming Arena",
    }),
    getWalletConnectConnector(),
  ],
  ssr: false, // Disable SSR to avoid indexedDB issues
  multiInjectedProviderDiscovery: true,
});

// Export the config for use in components
export const config = wagmiConfig;
