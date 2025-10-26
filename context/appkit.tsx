"use client";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { 
  base, 
  baseSepolia, 
  arbitrum, 
  arbitrumSepolia, 
  mainnet, 
  sepolia,
  lisk,
  liskSepolia,
  bsc,
  bscTestnet,
  avalanche,
  avalancheFuji,
  polygon,
  polygonMumbai,
  optimism,
  optimismSepolia
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ReactNode } from "react";

// Environment detection (Billoq-style)
const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';

// Dynamic network configuration based on environment (Billoq-style)
const mainnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [lisk, arbitrum, base, bsc, avalanche, polygon, optimism, mainnet];
const testnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [liskSepolia, arbitrumSepolia, baseSepolia, bscTestnet, avalancheFuji, sepolia, polygonMumbai, optimismSepolia];

// Use appropriate networks based on environment (always ensure at least one network)
const supportedNetworks = isMainnet ? mainnetNetworks : testnetNetworks;

// 1. Get projectId at https://cloud.reown.com (using Billoq's project ID)
const projectId = "a9fbadc760baa309220363ec867b732e";

// 2. Create metadata for ZeroSum
const metadata = {
  name: "ZeroSum Gaming Arena",
  description: "Mathematical warfare where strategy beats luck. Privacy-fixed games with hidden numbers and true fairness.",
  url: "https://zerosum.arena", // Your actual domain
  icons: ["https://zerosum.arena/logo.png"], // Your ZeroSum logo
};

// Log environment info for debugging (Billoq-style)
console.log(`🌍 ZeroSum Environment: ${isMainnet ? 'Mainnet' : 'Testnet'}`);
console.log(`📡 Supported Networks:`, supportedNetworks.map(n => n.name));
console.log(`⚔️ ZeroSum Arena ready with multi-chain support!`);

// 3. Create the AppKit instance (Billoq-style configuration)
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: supportedNetworks,
  projectId,
  features: {
    email: false,
    socials: false,
    analytics: true, // Optional - defaults to your Cloud configuration
    onramp: isMainnet, // Enable onramp only for mainnet
  },
  // Optional: Add environment-specific features (Billoq-style)
  ...(isMainnet ? {
    // Mainnet specific configurations
    enableExplorer: true,
  } : {
    // Testnet specific configurations
    enableExplorer: true,
    enableOnramp: false, // Disable on-ramp for testnets
  })
});

interface AppKitProps {
  children: ReactNode;
}

export function AppKit({ children }: AppKitProps) {
  return <>{children}</>;
}
