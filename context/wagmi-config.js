import { createConfig, http } from 'wagmi';
import { mantle, mantleSepoliaTestnet } from 'wagmi/chains';

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
  mantle,
  mantleSepoliaTestnet,
};

export const wagmiConfig = createConfig({
  chains: [mantle, mantleSepoliaTestnet],
  transports: {
    [mantle.id]: http(),
    [mantleSepoliaTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
});