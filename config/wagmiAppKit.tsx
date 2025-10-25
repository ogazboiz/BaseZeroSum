// config/wagmiAppKit.tsx
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from environment variable
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'a9fbadc760baa309220363ec867b732e'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Environment detection
const isMainnet = process.env.NEXT_PUBLIC_ENVIRONMENT === 'mainnet'

// Dynamic network configuration based on environment
const mainnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [base]
const testnetNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia]

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
