import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mantle, mantleSepoliaTestnet, sepolia } from 'wagmi/chains'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "8387f0bbb57a265cd4dd96c3e658ac55"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Environment detection
const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet';

// Use appropriate networks based on environment
export const networks = isMainnet ? [mantle] : [mantleSepoliaTestnet, sepolia]

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
