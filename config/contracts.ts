// config/contracts.ts

// Contract addresses - Updated to match .env file
// export const CONTRACT_ADDRESSES = {
//   ZERO_SUM_SIMPLIFIED: '0x5ecc48015485c2d4025a33Df8F5AF79eF5e8B96B' as `0x${string}`,
//   ZERO_SUM_SPECTATOR: '0x1e1A47d93Fb1Fd616bbC1445f9f387C27f3Afc56' as `0x${string}`,
// } as const;
export const BaseSepoliaContractAddresses = {
  ZERO_SUM_SIMPLIFIED: '0x11bb298bbde9ffa6747ea104c2c39b3e59a399b4' as `0x${string}`,
  ZERO_SUM_SPECTATOR: '0x214124ae23b415b3aea3bb9e260a56dc022baf04' as `0x${string}`,
  // HARDCORE_MYSTERY: '0x2E56044dB3be726772D6E5afFD7BD813C6895025' as `0x${string}`, // Not deployed yet
} as const;

// Helper function to get contract addresses based on environment
export const getContractAddresses = () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'testnet';
  
  if (environment === 'mainnet') {
    return {
      ZERO_SUM_SIMPLIFIED: BaseSepoliaContractAddresses.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: BaseSepoliaContractAddresses.ZERO_SUM_SPECTATOR,
      // HARDCORE_MYSTERY: BaseSepoliaContractAddresses.HARDCORE_MYSTERY, // Not deployed yet
    };
  } else {
    // Testnet addresses (Base Sepolia)
    return {
      ZERO_SUM_SIMPLIFIED: BaseSepoliaContractAddresses.ZERO_SUM_SIMPLIFIED,
      ZERO_SUM_SPECTATOR: BaseSepoliaContractAddresses.ZERO_SUM_SPECTATOR,
      // HARDCORE_MYSTERY: BaseSepoliaContractAddresses.HARDCORE_MYSTERY, // Not deployed yet
    };
  }
};

// Contract types
export type ContractName = keyof typeof BaseSepoliaContractAddresses;
export type ContractAddress = typeof BaseSepoliaContractAddresses[ContractName];

// Contract metadata
export const CONTRACT_METADATA = {
  ZERO_SUM_SIMPLIFIED: {
    name: 'ZeroSum Simplified',
    description: 'Privacy-fixed basic games with minimal code size, 2-timeout system, and spectator integration',
    address: BaseSepoliaContractAddresses.ZERO_SUM_SIMPLIFIED,
  },
  ZERO_SUM_SPECTATOR: {
    name: 'ZeroSum Spectator',
    description: 'Spectator contract for viewing game status',
    address: BaseSepoliaContractAddresses.ZERO_SUM_SPECTATOR,
  },
  // HARDCORE_MYSTERY: {
  //   name: 'ZeroSum Hardcore Mystery',
  //   description: 'Hardcore mystery games with hidden numbers and Last Stand battle royale mode',
  //   address: BaseSepoliaContractAddresses.HARDCORE_MYSTERY,
  // },
} as const;
