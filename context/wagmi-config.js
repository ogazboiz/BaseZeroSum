import { createConfig, http } from 'wagmi';
import { mantle, mantleSepoliaTestnet, sepolia } from 'wagmi/chains';

// ZeroSum Contract Addresses
export const ZEROSUM_CONTRACT_ADDRESSES = {
  ZERO_SUM_SIMPLIFIED: '0x3b4B128d79cC2e0d9Af4f429A9bc74cD01bE6B7a',
  ZERO_SUM_SPECTATOR: '0x1bE77b80eE1729e4ad52243f0A5d109a2F266F89',
};

// Environment-based contract selection
export const getContractAddresses = () => {
  const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';
  
  if (isMainnet) {
    return {
      ZERO_SUM_SIMPLIFIED: ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SPECTATOR,
    };
  } else {
    return {
      ZERO_SUM_SIMPLIFIED: ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: ZEROSUM_CONTRACT_ADDRESSES.ZERO_SUM_SPECTATOR,
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