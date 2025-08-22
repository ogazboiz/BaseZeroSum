import { createConfig, http } from 'wagmi';
import {  mantleSepoliaTestnet } from 'wagmi/chains';

// ZeroSum Contract Addresses - Updated to match .env file
export const ZEROSUM_CONTRACT_ADDRESSES = {
  ZERO_SUM_SIMPLIFIED: '0xfb40c6BACc74019E01C0dD5b434CE896806D7579',
  ZERO_SUM_SPECTATOR: '0x151A0A2227B42D299b01a7D5AD3e1A81cB3BE1aE',
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
  mantleSepoliaTestnet,
};

// Multiple RPC endpoints for better reliability
const MANTLE_SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_MANTLE_SEPOLIA_RPC || 'https://rpc.sepolia.mantle.xyz',
  'https://sepolia.mantle.xyz',
  'https://mantle-sepolia.dwellir.com',
];

// Get timeout and retry settings from environment or use defaults
const RPC_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_RPC_TIMEOUT) || 10000;
const RPC_RETRY_COUNT = parseInt(process.env.NEXT_PUBLIC_RPC_RETRY_COUNT) || 2;
const RPC_RETRY_DELAY = parseInt(process.env.NEXT_PUBLIC_RPC_RETRY_DELAY) || 1000;

export const wagmiConfig = createConfig({
  chains: [mantleSepoliaTestnet],
  transports: {
    [mantleSepoliaTestnet.id]: http(MANTLE_SEPOLIA_RPCS[0], {
      // Add timeout and retry configuration
      timeout: RPC_TIMEOUT,
      retryCount: RPC_RETRY_COUNT,
      retryDelay: RPC_RETRY_DELAY,
    }),
  },
});