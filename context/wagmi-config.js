import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import {
  injected,
  walletConnect,
  metaMask,
  coinbaseWallet,
} from 'wagmi/connectors';
 
// ZeroSum Contract Addresses - Updated to Base Sepolia
export const ZEROSUM_CONTRACT_ADDRESSES = {
  ZERO_SUM_SIMPLIFIED: '0x11bb298bbde9ffa6747ea104c2c39b3e59a399b4',
  ZERO_SUM_SPECTATOR: '0x214124ae23b415b3aea3bb9e260a56dc022baf04',
};

// Environment-based contract selection - Updated to use .env variables
export const getContractAddresses = () => {
  const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';
  
  if (isMainnet) {
    return {
      ZERO_SUM_SIMPLIFIED: process.env.NEXT_PUBLIC_ZEROSUM_SIMPLIFIED_ADDRESS || ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: process.env.NEXT_PUBLIC_ZEROSUM_SPECTATOR_ADDRESS || ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SPECTATOR,
    };
  } else {
    return {
      ZERO_SUM_SIMPLIFIED: process.env.NEXT_PUBLIC_ZEROSUM_SIMPLIFIED_ADDRESS || ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: process.env.NEXT_PUBLIC_ZEROSUM_SPECTATOR_ADDRESS || ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SPECTATOR,
    };
  }
};

export const WAGMI_CHAINS = {
  base,
  baseSepolia,
};

// Multiple RPC endpoints for better reliability
const BASE_SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  'https://base-sepolia.g.alchemy.com/v2/demo',
  'https://base-sepolia.public.blastapi.io',
];

const BASE_RPCS = [
  process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
  'https://base.g.alchemy.com/v2/demo',
  'https://base.public.blastapi.io',
];

// Get timeout and retry settings from environment or use defaults
const RPC_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_RPC_TIMEOUT) || 10000;
const RPC_RETRY_COUNT = parseInt(process.env.NEXT_PUBLIC_RPC_RETRY_COUNT) || 2;
const RPC_RETRY_DELAY = parseInt(process.env.NEXT_PUBLIC_RPC_RETRY_DELAY) || 1000;

// Create WalletConnect connector only once
let walletConnectConnector = null;

const getWalletConnectConnector = () => {
  if (!walletConnectConnector) {
    walletConnectConnector = walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      metadata: {
        name: "ZeroSum Arena",
        description: "Battle in the ZeroSum Arena on Base",
        url: "https://zerosum-arena.vercel.app",
        icons: ["https://zerosum-arena.vercel.app/favicon.ico"],
      },
    });
  }
  return walletConnectConnector;
};

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(BASE_RPCS[0], {
      // Add timeout and retry configuration
      timeout: RPC_TIMEOUT,
      retryCount: RPC_RETRY_COUNT,
      retryDelay: RPC_RETRY_DELAY,
    }),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPCS[0], {
      // Add timeout and retry configuration
      timeout: RPC_TIMEOUT,
      retryCount: RPC_RETRY_COUNT,
      retryDelay: RPC_RETRY_DELAY,
    }),
  },
  connectors: [
    // Farcaster Mini App connector as the primary option
    farcasterMiniApp(),
    injected({
      target: "metaMask",
    }),
    metaMask(),
    coinbaseWallet({
      appName: "ZeroSum Arena",
    }),
    getWalletConnectConnector(),
  ],
  ssr: false, // Disable SSR to avoid indexedDB issues
  multiInjectedProviderDiscovery: true,
});