"use client";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import {  mantleSepoliaTestnet, mantle } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ReactNode } from "react";

// Environment detection
const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';

// Network configurations for ZeroSum
const mainnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mantle,
  // Add other mainnet networks if needed
];

const testnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mantleSepoliaTestnet,
  // sepolia, // Keep Sepolia for testing fallback
];

// Use appropriate networks based on environment
const supportedNetworks = isMainnet ? mainnetNetworks : testnetNetworks;

// 1. Get projectId at https://cloud.reown.com
const projectId = "8387f0bbb57a265cd4dd96c3e658ac55";

// 2. Create metadata for ZeroSum
const metadata = {
  name: "ZeroSum Gaming Arena",
  description: "Mathematical warfare where strategy beats luck. Privacy-fixed games with hidden numbers and true fairness.",
  url: "https://zerosum.arena", // Your actual domain
  icons: ["https://zerosum.arena/logo.png"], // Your ZeroSum logo
};

// Log environment info for debugging
console.log(`🌍 ZeroSum Environment: ${isMainnet ? 'Mantle Mainnet' : ' Testnet'}`);
console.log(`📡 Supported Networks:`, supportedNetworks.map(n => n.name));
console.log(`⚔️ ZeroSum Arena on Mantle Network ready!`);

// 3. Create the AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: supportedNetworks,
  projectId,
  features: {
    analytics: true,
  },
  // Mantle-specific configurations
  ...(isMainnet ? {
    // Mainnet specific configurations
    enableExplorer: true,
    enableOnramp: true, // Enable for real MNT purchases
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
