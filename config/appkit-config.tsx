import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
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
} from 'wagmi/chains'

// Get projectId from https://dashboard.reown.com (using Billoq's project ID)
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "a9fbadc760baa309220363ec867b732e"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Environment detection (Billoq-style)
const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';

// Dynamic network configuration based on environment (Billoq-style)
const mainnetNetworks = [lisk, arbitrum, base, bsc, avalanche, polygon, optimism, mainnet];
const testnetNetworks = [liskSepolia, arbitrumSepolia, baseSepolia, bscTestnet, avalancheFuji, sepolia, polygonMumbai, optimismSepolia];

// Use appropriate networks based on environment (always ensure at least one network)
export const networks = isMainnet ? mainnetNetworks : testnetNetworks

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
