'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { toast } from 'react-hot-toast';
import { ZeroSumSimplifiedABI } from '@/config/abis/ZeroSumSimplifiedABI';
import { getContractAddresses } from '@/context/wagmi-config';

// Helper function to get contract address
const getContractAddress = () => {
  const { ZERO_SUM_SIMPLIFIED } = getContractAddresses();
  return ZERO_SUM_SIMPLIFIED;
};

export function useWagmiZeroSumContract() {
  // Use wagmi's connection state directly (like mintmymood does)
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  
  // Debug connection state
  console.log('🔗 useWagmiZeroSumContract - Connection state:', {
    address,
    isConnected,
    chainId,
    connectorId: connector?.id,
    connectorName: connector?.name,
    connectorReady: connector?.ready
  });

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

    // Check if connector is ready
    if (connector && connector.ready === false) {
      toast.error('Wallet connector is not ready. Please try again.');
      return { success: false, error: 'Connector not ready' };
    }

    // Check if we're on the correct chain (Base Sepolia = 84532)
    if (chainId !== 84532) {
      toast.error(`Please switch to Base Sepolia network. Current chain: ${chainId}`);
      return { success: false, error: `Wrong chain: ${chainId}` };
    }

    try {
      toast.success(loadingMessage);
      console.log('🚀 Starting transaction with address:', address);
      
      const result = await contractCall();
      console.log('📤 Transaction result:', result);
      
      toast.success(successMessage);
      return { success: true, txHash: result, result };
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
        console.error('❌ Detailed error:', {
          message: errorMessage,
          error: err,
          stack: err instanceof Error ? err.stack : undefined
        });
        toast.error(`Transaction failed: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    }
  };

  // Create Quick Draw Game
  const createQuickDraw = async (entryFee: string) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
    try {
      console.log('🎮 Attempting to join game:', { gameId, entryFee, address, isConnected, chainId });
      
      return await executeTransaction(
        async () => {
          return await writeContractAsync({
            address: getContractAddress() as `0x${string}`,
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
    } catch (error) {
      console.error('❌ Unhandled error in joinGame:', error);
      toast.error('An unexpected error occurred while joining the game');
      return { success: false, error: 'Unhandled error' };
    }
  };

  // Make Move
  const makeMove = async (gameId: number, subtraction: number) => {
    return executeTransaction(
      async () => {
        return await writeContractAsync({
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
          address: getContractAddress() as `0x${string}`,
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
