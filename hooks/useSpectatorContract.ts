// hooks/useSpectatorContract.ts
import { useState } from 'react'
import { useConfig } from 'wagmi'
import { ethers } from 'ethers'
import { getEthersProvider, getEthersSigner } from '@/config/adapter'
import { toast } from 'react-hot-toast'
import { ZeroSumSpectatorABI } from '../config/abis/ZeroSumSpectatorABI'

// Contract addresses
const SPECTATOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SPECTATOR_CONTRACT_ADDRESS || "0x1620024163b8C9CE917b82932093A6De22Ba89d8"
// Use the same contract address as wagmi hook
import { getContractAddresses } from '@/context/wagmi-config'

// Helper function to get game contract address
const getZeroSumSimplifiedAddress = () => {
  const { ZERO_SUM_SIMPLIFIED } = getContractAddresses()
  return ZERO_SUM_SIMPLIFIED
}
const HARDCORE_MYSTERY_ADDRESS = process.env.NEXT_PUBLIC_HARDCORE_MYSTERY_CONTRACT_ADDRESS || "0x2E56044dB3be726772D6E5afFD7BD813C6895025"

// Game Contract Types
export enum GameContract {
  ZEROSUM_SIMPLIFIED = 'simplified',
  HARDCORE_MYSTERY = 'hardcore'
}

// Types for spectator contract
export interface Bet {
  bettor: string
  gameId: number
  predictedWinner: string
  amount: string
  claimed: boolean
  gameContract: string
}

export interface BettingInfo {
  totalBetAmount: string
  numberOfBets: number
  bettingAllowed: boolean
}

export interface BettingOdds {
  betAmounts: string[]
  oddPercentages: number[]
}

export interface BettingSettings {
  bettingFeePercent: number
  minimumBet: string
  globalBettingEnabled: boolean
}

// Helper function to get game contract address
const getGameContractAddress = (gameContract: GameContract): string => {
  switch (gameContract) {
    case GameContract.ZEROSUM_SIMPLIFIED:
      return getZeroSumSimplifiedAddress()
    case GameContract.HARDCORE_MYSTERY:
      return HARDCORE_MYSTERY_ADDRESS
    default:
      throw new Error('Invalid game contract type')
  }
}

// Main hook for spectator contract interactions (write functions)
export function useSpectatorContract() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Place Bet
  const placeBet = async (
    gameContract: GameContract,
    gameId: number, 
    predictedWinner: string, 
    amount: string
  ) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
      const gameContractAddress = getGameContractAddress(gameContract)
      
      const tx = await contract.placeBet(gameContractAddress, gameId, predictedWinner, {
        value: ethers.parseEther(amount)
      })
      
      toast.success('Placing bet...')
      await tx.wait()
      toast.success('Bet placed successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error placing bet:', error)
      toast.error(error.reason || error.message || 'Failed to place bet')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Claim Betting Winnings
  const claimBettingWinnings = async (gameContract: GameContract, gameId: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
      const gameContractAddress = getGameContractAddress(gameContract)
      
      const tx = await contract.claimBettingWinnings(gameContractAddress, gameId)
      
      toast.success('Claiming winnings...')
      await tx.wait()
      toast.success('Winnings claimed successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error claiming winnings:', error)
      toast.error(error.reason || error.message || 'Failed to claim winnings')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Withdraw Spectator Balance
  const withdrawSpectatorBalance = async () => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
      
      const tx = await contract.withdrawSpectatorBalance()
      
      toast.success('Withdrawing balance...')
      await tx.wait()
      toast.success('Balance withdrawn successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error withdrawing spectator balance:', error)
      toast.error(error.reason || error.message || 'Failed to withdraw balance')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    placeBet,
    claimBettingWinnings,
    withdrawSpectatorBalance
  }
}

// Hook for reading spectator contract data
export function useSpectatorData() {
  const config = useConfig()

  // Get contract instance
  const getSpectatorContract = () => {
    const provider = getEthersProvider(config)
    if (!provider) return null

    return new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
  }

  // Get Betting Info
  const getBettingInfo = async (gameContract: GameContract, gameId: number): Promise<BettingInfo | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const gameContractAddress = getGameContractAddress(gameContract)
      const info = await contract.getGameBettingInfo(gameContractAddress, gameId)
      
      return {
        totalBetAmount: ethers.formatEther(info.totalBetAmount),
        numberOfBets: Number(info.numberOfBets),
        bettingAllowed: info.bettingAllowed
      }
    } catch (error) {
      console.error('Error getting betting info:', error)
      return null
    }
  }

  // Get Betting Odds
  const getBettingOdds = async (
    gameContract: GameContract, 
    gameId: number, 
    players: string[]
  ): Promise<BettingOdds | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const gameContractAddress = getGameContractAddress(gameContract)
      const odds = await contract.getBettingOdds(gameContractAddress, gameId, players)
      
      return {
        betAmounts: odds.betAmounts.map((amount: any) => ethers.formatEther(amount)),
        oddPercentages: odds.oddPercentages.map((percentage: any) => Number(percentage))
      }
    } catch (error) {
      console.error('Error getting betting odds:', error)
      return null
    }
  }

  // Get Spectator Balance
  const getSpectatorBalance = async (address: string): Promise<string> => {
    try {
      const contract = getSpectatorContract()
      if (!contract || !address) return "0"

      const balance = await contract.spectatorBalances(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting spectator balance:', error)
      return "0"
    }
  }

  // Check if betting is allowed
  const isBettingAllowed = async (gameContract: GameContract, gameId: number): Promise<boolean> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return false

      const gameContractAddress = getGameContractAddress(gameContract)
      return await contract.isBettingAllowed(gameContractAddress, gameId)
    } catch (error) {
      console.error('Error checking if betting is allowed:', error)
      return false
    }
  }

  // Get total bets on specific player
  const getTotalBetsOnPlayer = async (
    gameContract: GameContract, 
    gameId: number, 
    playerAddress: string
  ): Promise<string> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return "0"

      const gameContractAddress = getGameContractAddress(gameContract)
      const gameKey = ethers.solidityPackedKeccak256(
        ["address", "uint256"], 
        [gameContractAddress, gameId]
      )
      const totalBets = await contract.totalBetsOnPlayer(gameKey, playerAddress)
      return ethers.formatEther(totalBets)
    } catch (error) {
      console.error('Error getting total bets on player:', error)
      return "0"
    }
  }

  // Check if betting is closed for a game
  const isBettingClosed = async (gameContract: GameContract, gameId: number): Promise<boolean> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return false

      const gameContractAddress = getGameContractAddress(gameContract)
      const gameKey = ethers.solidityPackedKeccak256(
        ["address", "uint256"], 
        [gameContractAddress, gameId]
      )
      return await contract.bettingClosed(gameKey)
    } catch (error) {
      console.error('Error checking if betting is closed:', error)
      return false
    }
  }

  // Get total game bets
  const getTotalGameBets = async (gameContract: GameContract, gameId: number): Promise<string> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return "0"

      const gameContractAddress = getGameContractAddress(gameContract)
      const gameKey = ethers.solidityPackedKeccak256(
        ["address", "uint256"], 
        [gameContractAddress, gameId]
      )
      const totalBets = await contract.totalGameBets(gameKey)
      return ethers.formatEther(totalBets)
    } catch (error) {
      console.error('Error getting total game bets:', error)
      return "0"
    }
  }

  // Get global betting settings
  const getBettingSettings = async (): Promise<BettingSettings | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const [bettingFeePercent, minimumBet, globalBettingEnabled] = await Promise.all([
        contract.bettingFeePercent(),
        contract.minimumBet(),
        contract.globalBettingEnabled()
      ])

      return {
        bettingFeePercent: Number(bettingFeePercent),
        minimumBet: ethers.formatEther(minimumBet),
        globalBettingEnabled
      }
    } catch (error) {
      console.error('Error getting betting settings:', error)
      return null
    }
  }

  // Check if a contract is registered
  const isContractRegistered = async (gameContract: GameContract): Promise<boolean> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return false

      const gameContractAddress = getGameContractAddress(gameContract)
      return await contract.registeredContracts(gameContractAddress)
    } catch (error) {
      console.error('Error checking contract registration:', error)
      return false
    }
  }

  // ✅ NEW: Check if user has bet on specific game
  const hasUserBetOnGame = async (gameContract: GameContract, gameId: number, userAddress: string): Promise<boolean> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return false

      const gameContractAddress = getGameContractAddress(gameContract)
      return await contract.hasUserBetOnGame(gameContractAddress, gameId, userAddress)
    } catch (error) {
      console.error('Error checking if user has bet on game:', error)
      return false
    }
  }

  // ✅ NEW: Get user's bet info for specific game
  const getUserBetInfo = async (gameContract: GameContract, gameId: number, userAddress: string): Promise<{
    hasBet: boolean
    predictedWinner: string
    amount: string
    claimed: boolean
    timestamp: number
  } | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const gameContractAddress = getGameContractAddress(gameContract)
      const betInfo = await contract.getUserBetInfo(gameContractAddress, gameId, userAddress)
      
      return {
        hasBet: betInfo.hasBet,
        predictedWinner: betInfo.predictedWinner,
        amount: ethers.formatEther(betInfo.amount),
        claimed: betInfo.claimed,
        timestamp: Number(betInfo.timestamp)
      }
    } catch (error) {
      console.error('Error getting user bet info:', error)
      return null
    }
  }

  // Get user's betting history
  const getUserBettingHistory = async (userAddress: string): Promise<string[]> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return []
      return await contract.getUserBettingHistory(userAddress)
    } catch (error) {
      console.error('Error getting user betting history:', error)
      return []
    }
  }

  // Get user's detailed betting history
  const getUserBettingHistoryDetailed = async (userAddress: string, limit: number = 50): Promise<{
    gameKeys: string[]
    gameContracts: string[]
    gameIds: number[]
    predictedWinners: string[]
    amounts: string[]
    claimed: boolean[]
    timestamps: number[]
  }> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return {
        gameKeys: [],
        gameContracts: [],
        gameIds: [],
        predictedWinners: [],
        amounts: [],
        claimed: [],
        timestamps: []
      }
      
      const result = await contract.getUserBettingHistoryDetailed(userAddress, limit)
      
      return {
        gameKeys: result.gameKeys,
        gameContracts: result.gameContracts,
        gameIds: result.gameIds.map((id: any) => Number(id)),
        predictedWinners: result.predictedWinners,
        amounts: result.amounts.map((amount: any) => ethers.formatEther(amount)),
        claimed: result.claimed,
        timestamps: result.timestamps.map((timestamp: any) => Number(timestamp))
      }
    } catch (error) {
      console.error('Error getting user detailed betting history:', error)
      return {
        gameKeys: [],
        gameContracts: [],
        gameIds: [],
        predictedWinners: [],
        amounts: [],
        claimed: [],
        timestamps: []
      }
    }
  }

  // Get game betting stats
  const getGameBettingStats = async (gameContract: GameContract, gameId: number): Promise<{
    totalBetAmount: string
    numberOfBets: number
    numberOfUniqueBettors: number
    bettingAllowed: boolean
    players: string[]
    playerBetAmounts: string[]
    playerBetCounts: number[]
  } | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null
      
      const gameContractAddress = getGameContractAddress(gameContract)
      const result = await contract.getGameBettingStats(gameContractAddress, gameId)
      
      return {
        totalBetAmount: ethers.formatEther(result.totalBetAmount),
        numberOfBets: Number(result.numberOfBets),
        numberOfUniqueBettors: Number(result.numberOfUniqueBettors),
        bettingAllowed: result.bettingAllowed,
        players: result.players,
        playerBetAmounts: result.playerBetAmounts.map((amount: any) => ethers.formatEther(amount)),
        playerBetCounts: result.playerBetCounts.map((count: any) => Number(count))
      }
    } catch (error) {
      console.error('Error getting game betting stats:', error)
      return null
    }
  }

  // Get contract addresses
  const getContractAddresses = () => ({
    spectator: SPECTATOR_CONTRACT_ADDRESS,
    zeroSumSimplified: getZeroSumSimplifiedAddress(),
    hardcoreMystery: HARDCORE_MYSTERY_ADDRESS
  })

  return {
    getBettingInfo,
    getBettingOdds,
    getSpectatorBalance,
    isBettingAllowed,
    getTotalBetsOnPlayer,
    isBettingClosed,
    getTotalGameBets,
    getBettingSettings,
    isContractRegistered,
    hasUserBetOnGame,
    getUserBetInfo,
    getUserBettingHistory,
    getUserBettingHistoryDetailed,
    getGameBettingStats,
    getContractAddresses
  }
}

// Convenience hooks for specific game contracts
export function useZeroSumSimplifiedSpectator() {
  const { placeBet, claimBettingWinnings, withdrawSpectatorBalance, loading } = useSpectatorContract()
  const spectatorData = useSpectatorData()

  return {
    loading,
    placeBet: (gameId: number, predictedWinner: string, amount: string) => 
      placeBet(GameContract.ZEROSUM_SIMPLIFIED, gameId, predictedWinner, amount),
    claimBettingWinnings: (gameId: number) => 
      claimBettingWinnings(GameContract.ZEROSUM_SIMPLIFIED, gameId),
    withdrawSpectatorBalance,
    getBettingInfo: (gameId: number) => 
      spectatorData.getBettingInfo(GameContract.ZEROSUM_SIMPLIFIED, gameId),
    getBettingOdds: (gameId: number, players: string[]) => 
      spectatorData.getBettingOdds(GameContract.ZEROSUM_SIMPLIFIED, gameId, players),
    isBettingAllowed: (gameId: number) => 
      spectatorData.isBettingAllowed(GameContract.ZEROSUM_SIMPLIFIED, gameId),
    getTotalBetsOnPlayer: (gameId: number, playerAddress: string) => 
      spectatorData.getTotalBetsOnPlayer(GameContract.ZEROSUM_SIMPLIFIED, gameId, playerAddress),
    isBettingClosed: (gameId: number) => 
      spectatorData.isBettingClosed(GameContract.ZEROSUM_SIMPLIFIED, gameId),
    getTotalGameBets: (gameId: number) => 
      spectatorData.getTotalGameBets(GameContract.ZEROSUM_SIMPLIFIED, gameId),
    // Add new functions without duplicates
    hasUserBetOnGame: (gameId: number, userAddress: string) => 
      spectatorData.hasUserBetOnGame(GameContract.ZEROSUM_SIMPLIFIED, gameId, userAddress),
    getUserBetInfo: (gameId: number, userAddress: string) => 
      spectatorData.getUserBetInfo(GameContract.ZEROSUM_SIMPLIFIED, gameId, userAddress),
    getUserBettingHistory: (userAddress: string) => 
      spectatorData.getUserBettingHistory(userAddress),
    getUserBettingHistoryDetailed: (userAddress: string, limit: number = 50) => 
      spectatorData.getUserBettingHistoryDetailed(userAddress, limit),
    getGameBettingStats: (gameId: number) => 
      spectatorData.getGameBettingStats(GameContract.ZEROSUM_SIMPLIFIED, gameId)
  }
}

export function useHardcoreMysterySpectator() {
  const { placeBet, claimBettingWinnings, withdrawSpectatorBalance, loading } = useSpectatorContract()
  const spectatorData = useSpectatorData()

  return {
    loading,
    placeBet: (gameId: number, predictedWinner: string, amount: string) => 
      placeBet(GameContract.HARDCORE_MYSTERY, gameId, predictedWinner, amount),
    claimBettingWinnings: (gameId: number) => 
      claimBettingWinnings(GameContract.HARDCORE_MYSTERY, gameId),
    withdrawSpectatorBalance,
    getBettingInfo: (gameId: number) => 
      spectatorData.getBettingInfo(GameContract.HARDCORE_MYSTERY, gameId),
    getBettingOdds: (gameId: number, players: string[]) => 
      spectatorData.getBettingOdds(GameContract.HARDCORE_MYSTERY, gameId, players),
    isBettingAllowed: (gameId: number) => 
      spectatorData.isBettingAllowed(GameContract.HARDCORE_MYSTERY, gameId),
    getTotalBetsOnPlayer: (gameId: number, playerAddress: string) => 
      spectatorData.getTotalBetsOnPlayer(GameContract.HARDCORE_MYSTERY, gameId, playerAddress),
    isBettingClosed: (gameId: number) => 
      spectatorData.isBettingClosed(GameContract.HARDCORE_MYSTERY, gameId),
    getTotalGameBets: (gameId: number) => 
      spectatorData.getTotalGameBets(GameContract.HARDCORE_MYSTERY, gameId),
    // Add new functions without duplicates
    hasUserBetOnGame: (gameId: number, userAddress: string) => 
      spectatorData.hasUserBetOnGame(GameContract.HARDCORE_MYSTERY, gameId, userAddress),
    getUserBetInfo: (gameId: number, userAddress: string) => 
      spectatorData.getUserBetInfo(GameContract.HARDCORE_MYSTERY, gameId, userAddress),
    getUserBettingHistory: (userAddress: string) => 
      spectatorData.getUserBettingHistory(userAddress),
    getUserBettingHistoryDetailed: (userAddress: string, limit: number = 50) => 
      spectatorData.getUserBettingHistoryDetailed(userAddress, limit),
    getGameBettingStats: (gameId: number) => 
      spectatorData.getGameBettingStats(GameContract.HARDCORE_MYSTERY, gameId)
  }
}