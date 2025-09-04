// config/wagmiConfigSimple.ts - Simplified wagmi configuration without Farcaster connector
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import {
  injected,
  walletConnect,
  metaMask,
  coinbaseWallet,
} from "wagmi/connectors";

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
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http('https://base-sepolia.drpc.org'),
  },
  connectors: [
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
