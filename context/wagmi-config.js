import { createConfig, http } from 'wagmi';
import { mantle, mantleSepoliaTestnet, sepolia } from 'wagmi/chains';

// ZeroSum Contract Addresses - Updated to match .env file
export const ZEROSUM_CONTRACT_ADDRESSES = {
  ZERO_SUM_SIMPLIFIED: '0x5ecc48015485c2d4025a33Df8F5AF79eF5e8B96B',
  ZERO_SUM_SPECTATOR: '0x1e1A47d93Fb1Fd616bbC1445f9f387C27f3Afc56',
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
  mantle,
  mantleSepoliaTestnet,
  sepolia, // Keep for fallback testing
};

export const wagmiConfig = createConfig({
  chains: [mantle, mantleSepoliaTestnet, sepolia],
  transports: {
    [mantle.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
    [sepolia.id]: http(), // Default Sepolia RPC
  },
});