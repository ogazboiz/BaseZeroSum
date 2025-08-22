import { getClient, getConnectorClient } from "@wagmi/core";
import {
    FallbackProvider,
    JsonRpcProvider,
    BrowserProvider,
    JsonRpcSigner,
} from "ethers";

// Provider singleton to prevent multiple instances
let providerInstance = null;
let lastConfig = null;
let lastChainId = null;

// Network status tracking to prevent excessive retries
let networkStatus = {
    lastCheck: 0,
    isAvailable: true,
    retryCount: 0,
    maxRetries: 3,
};

// Check if we should attempt to create a provider
function shouldAttemptProviderCreation() {
    const now = Date.now();
    const timeSinceLastCheck = now - networkStatus.lastCheck;
    
    // If network was recently unavailable, wait before retrying
    if (!networkStatus.isAvailable && timeSinceLastCheck < 5000) {
        return false;
    }
    
    // If we've exceeded max retries, wait longer
    if (networkStatus.retryCount >= networkStatus.maxRetries) {
        if (timeSinceLastCheck < 30000) { // Wait 30 seconds
            return false;
        }
        networkStatus.retryCount = 0; // Reset retry count
    }
    
    return true;
}

// Update network status
function updateNetworkStatus(isAvailable) {
    networkStatus.isAvailable = isAvailable;
    networkStatus.lastCheck = Date.now();
    if (!isAvailable) {
        networkStatus.retryCount++;
    } else {
        networkStatus.retryCount = 0;
    }
}

export function clientToProvider(client) {
    const { chain, transport } = client;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    if (transport.type === "fallback") {
        const providers = transport.transports.map(
            ({ value }) => new JsonRpcProvider(value?.url, network, {
                // Add retry configuration to prevent infinite loops
                retryCount: 2,
                retryDelay: 1000,
                timeout: 10000,
            })
        );
        if (providers.length === 1) return providers[0];
        return new FallbackProvider(providers);
    }
    return new JsonRpcProvider(transport.url, network, {
        // Add retry configuration to prevent infinite loops
        retryCount: 2,
        retryDelay: 1000,
        timeout: 10000,
    });
}

/** Action to convert a viem Client to an ethers.js Provider. */
export function getEthersProvider(config, { chainId } = {}) {
    // Check if we should attempt provider creation
    if (!shouldAttemptProviderCreation()) {
        console.log('⏳ Skipping provider creation - network recently unavailable')
        return null;
    }
    
    // Check if we can reuse the existing provider instance
    if (providerInstance && 
        lastConfig === config && 
        lastChainId === chainId) {
        console.log('♻️ Reusing existing provider instance')
        return providerInstance;
    }
    
    console.log('🔧 getEthersProvider called with:', { config, chainId })
    const client = getClient(config, { chainId });
    console.log('🔧 Client:', client)
    if (!client) {
        console.log('❌ No client available')
        updateNetworkStatus(false);
        return null;
    }
    
    try {
        // Create new provider only if config or chainId changed
        if (!providerInstance || lastConfig !== config || lastChainId !== chainId) {
            console.log('🆕 Creating new provider instance')
            providerInstance = clientToProvider(client);
            lastConfig = config;
            lastChainId = chainId;
        }
        
        console.log('🔧 Provider created/reused:', providerInstance)
        updateNetworkStatus(true);
        return providerInstance;
    } catch (error) {
        console.error('❌ Failed to create provider:', error)
        updateNetworkStatus(false);
        return null;
    }
}

// Function to clear provider cache (useful for testing or when switching networks)
export function clearProviderCache() {
    providerInstance = null;
    lastConfig = null;
    lastChainId = null;
    console.log('🗑️ Provider cache cleared')
}

export function clientToSigner(client) {
    const { account, chain, transport } = client;

    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport, network);
    const signer = new JsonRpcSigner(provider, account.address);
    return signer;
}

/** Action to convert a viem Wallet Client to an ethers.js Signer. */
export async function getEthersSigner(config, { chainId } = {}) {
    const client = await getConnectorClient(config, { chainId });
    return clientToSigner(client);
}