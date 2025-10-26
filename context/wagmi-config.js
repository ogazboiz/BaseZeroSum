import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import {
  injected,
  walletConnect,
  metaMask,
  coinbaseWallet,
} from 'wagmi/connectors';

// Define Sonic chains
export const sonic = defineChain({
  id: 146,
  name: 'Sonic',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.soniclabs.com'],
    },
    public: {
      http: ['https://rpc.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan',
      url: 'https://sonicscan.org',
    },
  },
});

export const sonicTestnet = defineChain({
  id: 14601,
  name: 'Sonic Testnet',
  network: 'sonic-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.soniclabs.com'],
    },
    public: {
      http: ['https://rpc.testnet.soniclabs.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan Testnet',
      url: 'https://testnet.sonicscan.org',
    },
  },
  testnet: true,
});
 
// Number Slayer Gaming Contract Addresses - Updated for Sonic
export const NUMBER_SLAYER_CONTRACT_ADDRESSES = {
  NUMBER_SLAYER_GAMING: '0x0000000000000000000000000000000000000000', // TODO: Deploy to Sonic
  NUMBER_SLAYER_SPECTATOR: '0x0000000000000000000000000000000000000000', // TODO: Deploy to Sonic
};

// Environment-based contract selection - Updated for Sonic
export const getContractAddresses = () => {
  const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';
  
  if (isMainnet) {
    return {
      NUMBER_SLAYER_GAMING: process.env.NEXT_PUBLIC_NUMBER_SLAYER_GAMING_ADDRESS || NUMBER_SLAYER_CONTRACT_ADDRESSES.NUMBER_SLAYER_GAMING,
      NUMBER_SLAYER_SPECTATOR: process.env.NEXT_PUBLIC_NUMBER_SLAYER_SPECTATOR_ADDRESS || NUMBER_SLAYER_CONTRACT_ADDRESSES.NUMBER_SLAYER_SPECTATOR,
    };
  } else {
    return {
      NUMBER_SLAYER_GAMING: process.env.NEXT_PUBLIC_NUMBER_SLAYER_GAMING_ADDRESS || NUMBER_SLAYER_CONTRACT_ADDRESSES.NUMBER_SLAYER_GAMING,
      NUMBER_SLAYER_SPECTATOR: process.env.NEXT_PUBLIC_NUMBER_SLAYER_SPECTATOR_ADDRESS || NUMBER_SLAYER_CONTRACT_ADDRESSES.NUMBER_SLAYER_SPECTATOR,
    };
  }
};

export const WAGMI_CHAINS = {
  sonic,
  sonicTestnet,
};

// Multiple RPC endpoints for better reliability
const SONIC_TESTNET_RPCS = [
  process.env.NEXT_PUBLIC_SONIC_TESTNET_RPC || 'https://rpc.testnet.soniclabs.com',
];

const SONIC_RPCS = [
  process.env.NEXT_PUBLIC_SONIC_RPC || 'https://rpc.soniclabs.com',
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
        name: "Number Slayer Gaming Arena",
        description: "Battle in the Number Slayer Gaming Arena on Sonic",
        url: "https://number-slayer-gaming.vercel.app",
        icons: ["https://number-slayer-gaming.vercel.app/favicon.ico"],
      },
    });
  }
  return walletConnectConnector;
};

export const wagmiConfig = createConfig({
  chains: [sonicTestnet], // Only Sonic Testnet for testing
  transports: {
    [sonicTestnet.id]: http(SONIC_TESTNET_RPCS[0], {
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
      appName: "Number Slayer Gaming Arena",
    }),
    getWalletConnectConnector(),
  ],
  ssr: false, // Disable SSR to avoid indexedDB issues
  multiInjectedProviderDiscovery: true,
});