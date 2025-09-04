import { ethers } from "ethers";
import { getClient, getConnectorClient } from "@wagmi/core";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "wagmi/chains";

/** Get ethers.js provider for contract interactions - Your Original Simple Pattern! */
export function getProvider({ chainId } = {}) {
    const targetChainId = chainId || 84532; // Default to Base Sepolia
    const rpcUrl = targetChainId === 8453 
        ? "https://mainnet.base.org" 
        : "https://sepolia.base.org";
    
    console.log(`🔗 Creating ethers provider for chain ${targetChainId}`);
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        console.log("✅ Ethers provider created successfully");
        return provider;
    } catch (error) {
        console.error("❌ Failed to create ethers provider:", error);
        throw error;
    }
}

/** Get ethers.js provider for contract interactions - Alias for compatibility */
export function getEthersProvider(config, { chainId } = {}) {
    return getProvider({ chainId });
}

/** Create ethers contract instance - Your Original Pattern! */
export function getContract(address, abi, { chainId } = {}) {
    const provider = getProvider({ chainId });
    console.log(`📄 Creating contract at ${address}`);
    
    try {
        const contract = new ethers.Contract(address, abi, provider);
        console.log("✅ Contract created successfully");
        return contract;
    } catch (error) {
        console.error("❌ Failed to create contract:", error);
        throw error;
    }
}

/** Get viem client for write operations */
export function getViemClient(wagmiConfig = null, { chainId } = {}) {
    console.log("🔧 getViemClient called with:", { chainId, hasConfig: !!wagmiConfig });
    
    const targetChainId = chainId || 84532; // Default to Base Sepolia
    const chain = targetChainId === 8453 ? base : baseSepolia;
    const rpcUrl = targetChainId === 8453 
        ? "https://mainnet.base.org" 
        : "https://sepolia.base.org";
    
    console.log(`🔗 Creating viem client for chain ${targetChainId} (${chain.name})`);
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    
    try {
        const client = createPublicClient({
            chain: chain,
            transport: http(rpcUrl),
        });
        console.log("✅ Viem client created successfully");
        return client;
    } catch (error) {
        console.error("❌ Failed to create viem client:", error);
        throw error;
    }
}

/** Get viem wallet client for write operations */
export async function getViemWalletClient(wagmiConfig, { chainId } = {}) {
    try {
        console.log("🔧 Getting viem wallet client for write operations...");
        const walletClient = await getConnectorClient(wagmiConfig, { chainId });
        console.log("✅ Viem wallet client obtained");
        return walletClient;
    } catch (error) {
        console.error("❌ Failed to get viem wallet client:", error);
        throw error;
    }
}