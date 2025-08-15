// config/contracts.ts

// Contract addresses - Updated to match .env file
// export const CONTRACT_ADDRESSES = {
//   ZERO_SUM_SIMPLIFIED: '0x5ecc48015485c2d4025a33Df8F5AF79eF5e8B96B' as `0x${string}`,
//   ZERO_SUM_SPECTATOR: '0x1e1A47d93Fb1Fd616bbC1445f9f387C27f3Afc56' as `0x${string}`,
// } as const;
export const MantleSepoliaTestnetContractAddresses = {
  ZERO_SUM_SIMPLIFIED: '0xfb40c6BACc74019E01C0dD5b434CE896806D7579' as `0x${string}`,
  ZERO_SUM_SPECTATOR: '0x151A0A2227B42D299b01a7D5AD3e1A81cB3BE1aE' as `0x${string}`,
} as const;

// Helper function to get contract addresses based on environment
export const getContractAddresses = () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'testnet';
  
  if (environment === 'mainnet') {
    return {
      ZERO_SUM_SIMPLIFIED: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SPECTATOR,
    };
  } else {
    // Testnet addresses (using same addresses for now, can be updated later)
    return {
      ZERO_SUM_SIMPLIFIED: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SPECTATOR,
    };
  }
};

// Contract types
export type ContractName = keyof typeof MantleSepoliaTestnetContractAddresses;
export type ContractAddress = typeof MantleSepoliaTestnetContractAddresses[ContractName];

// Contract metadata
export const CONTRACT_METADATA = {
  ZERO_SUM_SIMPLIFIED: {
    name: 'ZeroSum Simplified',
    description: 'Privacy-fixed basic games with minimal code size, 2-timeout system, and spectator integration',
    address: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SIMPLIFIED,
  },
  ZERO_SUM_SPECTATOR: {
    name: 'ZeroSum Spectator',
    description: 'Spectator contract for viewing game status',
    address: MantleSepoliaTestnetContractAddresses.ZERO_SUM_SPECTATOR,
  },
} as const;
