'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'react-hot-toast';
import { ZeroSumSimplifiedABI } from '@/config/abis/ZeroSumSimplifiedABI';
import { getContractAddresses } from '@/context/wagmi-config';

// Contract addresses
const { ZERO_SUM_SIMPLIFIED } = getContractAddresses();

export function useWagmiZeroSumContract() {
  // Unified wallet connection state (AppKit + Wagmi)
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  
  // Unified state - prioritize AppKit (Farcaster) connection
  const address = appkitAddress || wagmiAddress;
  const isConnected = appkitIsConnected || wagmiIsConnected;
  
  // Debug connection state
  console.log('🔗 useWagmiZeroSumContract - Connection state:', {
    appkitAddress,
    appkitIsConnected,
    wagmiAddress,
    wagmiIsConnected,
    unifiedAddress: address,
    unifiedIsConnected: isConnected
  });
  
  const { writeContractAsync } = useWriteContract();

  // Generic transaction handler with better error handling (mintmymood approach)
  const executeTransaction = async (
    contractCall: () => Promise<any>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      toast.success(loadingMessage);
      console.log('🚀 Starting transaction with address:', address);
      
      const result = await contractCall();
      console.log('📤 Transaction result:', result);
      
      toast.success(successMessage);
      return { success: true, result };
    } catch (err) {
      console.error('❌ Transaction error:', err);
      
      // Filter out user rejection errors (mintmymood approach)
      if (
        err instanceof Error &&
        (err.message.includes("User rejected the request") ||
         err.message.includes("User denied") ||
         err.message.includes("cancelled"))
      ) {
        toast.error("Transaction cancelled.");
        return { success: false, error: 'User cancelled' };
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error(`${errorMessage}: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    }
  };

  // Create Quick Draw Game
  const createQuickDraw = async (entryFee: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "createQuickDraw",
          value: BigInt(parseFloat(entryFee) * 1e18), // Convert to wei
        });
      },
      'Creating Quick Draw game...',
      'Quick Draw game created successfully!',
      'Failed to create Quick Draw game'
    );
  };

  // Create Strategic Game
  const createStrategic = async (entryFee: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "createStrategic",
          value: BigInt(parseFloat(entryFee) * 1e18), // Convert to wei
        });
      },
      'Creating Strategic game...',
      'Strategic game created successfully!',
      'Failed to create Strategic game'
    );
  };

  // Join Game
  const joinGame = async (gameId: number, entryFee: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "joinGame",
          args: [BigInt(gameId)],
          value: BigInt(parseFloat(entryFee) * 1e18), // Convert to wei
        });
      },
      'Joining game...',
      'Successfully joined the game!',
      'Failed to join game'
    );
  };

  // Make Move
  const makeMove = async (gameId: number, subtraction: number) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "makeMove",
          args: [BigInt(gameId), BigInt(subtraction)],
        });
      },
      'Making move...',
      'Move made successfully!',
      'Failed to make move'
    );
  };

  // Handle Timeout
  const handleTimeout = async (gameId: number) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "handleTimeout",
          args: [BigInt(gameId)],
        });
      },
      'Handling timeout...',
      'Timeout handled successfully!',
      'Failed to handle timeout'
    );
  };

  // Cancel Waiting Game
  const cancelWaitingGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "cancelWaitingGame",
          args: [BigInt(gameId)],
        });
      },
      'Cancelling game...',
      'Game cancelled successfully!',
      'Failed to cancel game'
    );
  };

  // Force Finish Inactive Game
  const forceFinishInactiveGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "forceFinishInactiveGame",
          args: [BigInt(gameId)],
        });
      },
      'Force finishing game...',
      'Game force finished successfully!',
      'Failed to force finish game'
    );
  };

  // Withdraw
  const withdraw = async () => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "withdraw",
        });
      },
      'Withdrawing balance...',
      'Balance withdrawn successfully!',
      'Failed to withdraw'
    );
  };

  // Stake
  const stake = async (amount: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "stake",
          value: BigInt(parseFloat(amount) * 1e18), // Convert to wei
        });
      },
      'Staking ETH...',
      'ETH staked successfully!',
      'Failed to stake'
    );
  };

  // Unstake
  const unstake = async (amount: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "unstake",
          args: [BigInt(parseFloat(amount) * 1e18)], // Convert to wei
        });
      },
      'Unstaking ETH...',
      'ETH unstaked successfully!',
      'Failed to unstake'
    );
  };

  // Claim Rewards
  const claimRewards = async () => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: ZERO_SUM_SIMPLIFIED as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          functionName: "claimRewards",
        });
      },
      'Claiming rewards...',
      'Rewards claimed successfully!',
      'Failed to claim rewards'
    );
  };

  return {
    createQuickDraw,
    createStrategic,
    joinGame,
    makeMove,
    handleTimeout,
    cancelWaitingGame,
    forceFinishInactiveGame,
    withdraw,
    stake,
    unstake,
    claimRewards,
    isConnected,
    address,
  };
}

// Hook for waiting for transaction receipts (mintmymood approach)
export function useTransactionReceipt(hash: `0x${string}` | undefined) {
  const { data: receipt, isSuccess, isLoading } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt,
    isSuccess,
    isLoading,
  };
}
