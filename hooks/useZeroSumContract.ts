// hooks/useZeroSumContracts.ts
import { useState, useEffect } from 'react'
import { useConfig } from 'wagmi'
import { ethers } from 'ethers'
import { getEthersProvider, getEthersSigner } from '@/config/adapter'
import { toast } from 'react-hot-toast'
import { ZeroSumSimplifiedABI } from '../config/abis/ZeroSumSimplifiedABI'
import { ZeroSumSpectatorABI } from '../config/abis/ZeroSumSpectatorABI'

// Contract addresses - Update these with your deployed addresses
const GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS || "0x5ecc48015485c2d4025a33Df8F5AF79eF5e8B96B"
const SPECTATOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SPECTATOR_CONTRACT_ADDRESS || "0x1e1A47d93Fb1Fd616bbC1445f9f387C27f3Afc56"

// Types based on your actual contract
export enum GameMode {
  QUICK_DRAW = 0,
  STRATEGIC = 1
}

export enum GameStatus {
  WAITING = 0,
  ACTIVE = 1,
  FINISHED = 2
}

export interface GameData {
  gameId: number
  mode: GameMode
  currentNumber: number
  currentPlayer: string
  status: GameStatus
  entryFee: string
  prizePool: string
  winner: string
  numberGenerated: boolean
}

export interface PlayerStats {
  balance: string
  wins: number
  played: number
  winRate: number
  stakedAmount: string
}

export interface PlayerView {
  number: number
  yourTurn: boolean
  timeLeft: number
  yourTimeouts: number
  opponentTimeouts: number
}

export interface StakingInfo {
  amount: string
  lastReward: number
  rewards: string
}

export interface SpectatorGameData {
  status: GameStatus
  winner: string
  players: string[]
  currentNumber: number
  numberGenerated: boolean
  currentPlayer: string
  mode: GameMode
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

// Main hook for contract interactions (write functions)
export function useZeroSumContract() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Create Quick Draw Game
  const createQuickDraw = async (entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.createQuickDraw({
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Creating Quick Draw game...')
      const receipt = await tx.wait()
      
      // Extract game ID from GameCreated event
      let gameId = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'GameCreated') {
            gameId = parsed.args[0].toString()
            break
          }
        } catch (e) {
          // Skip logs that don't match our interface
        }
      }
      
      toast.success('Quick Draw game created successfully!')
      return { success: true, gameId, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating Quick Draw:', error)
      toast.error(error.reason || error.message || 'Failed to create game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Create Strategic Game
  const createStrategic = async (entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.createStrategic({
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Creating Strategic game...')
      const receipt = await tx.wait()
      
      // Extract game ID from GameCreated event
      let gameId = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'GameCreated') {
            gameId = parsed.args[0].toString()
            break
          }
        } catch (e) {
          // Skip logs that don't match our interface
        }
      }
      
      toast.success('Strategic game created successfully!')
      return { success: true, gameId, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating Strategic:', error)
      toast.error(error.reason || error.message || 'Failed to create game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Join Game
  const joinGame = async (gameId: number, entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.joinGame(gameId, {
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Joining game...')
      await tx.wait()
      toast.success('Successfully joined the game!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error joining game:', error)
      toast.error(error.reason || error.message || 'Failed to join game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Make Move
  const makeMove = async (gameId: number, subtraction: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.makeMove(gameId, subtraction)
      
      toast.success('Making move...')
      await tx.wait()
      toast.success('Move made successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error making move:', error)
      toast.error(error.reason || error.message || 'Invalid move')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Handle Timeout
  const handleTimeout = async (gameId: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.handleTimeout(gameId)
      
      toast.success('Handling timeout...')
      await tx.wait()
      toast.success('Timeout handled!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error handling timeout:', error)
      toast.error(error.reason || error.message || 'Failed to handle timeout')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Withdraw Balance
  const withdraw = async () => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.withdraw()
      
      toast.success('Withdrawing balance...')
      await tx.wait()
      toast.success('Balance withdrawn successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      toast.error(error.reason || error.message || 'Failed to withdraw')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Stake ETH
  const stake = async (amount: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.stake({
        value: ethers.parseEther(amount)
      })
      
      toast.success('Staking ETH...')
      await tx.wait()
      toast.success('ETH staked successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error staking:', error)
      toast.error(error.reason || error.message || 'Failed to stake')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Unstake ETH
  const unstake = async (amount: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.unstake(ethers.parseEther(amount))
      
      toast.success('Unstaking ETH...')
      await tx.wait()
      toast.success('ETH unstaked successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error unstaking:', error)
      toast.error(error.reason || error.message || 'Failed to unstake')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Claim Rewards
  const claimRewards = async () => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
      
      const tx = await contract.claimRewards()
      
      toast.success('Claiming rewards...')
      await tx.wait()
      toast.success('Rewards claimed successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error claiming rewards:', error)
      toast.error(error.reason || error.message || 'Failed to claim rewards')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createQuickDraw,
    createStrategic,
    joinGame,
    makeMove,
    handleTimeout,
    withdraw,
    stake,
    unstake,
    claimRewards
  }
}

// Hook for reading contract data
export function useZeroSumData() {
  const config = useConfig()

  // Get contract instances
  const getContracts = () => {
    const provider = getEthersProvider(config)
    if (!provider) return null

    const gameContract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, provider)
    const spectatorContract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
    
    return { gameContract, spectatorContract }
  }

  // Get Game Data
  const getGame = async (gameId: number): Promise<GameData | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const game = await contracts.gameContract.getGame(gameId)
      
      return {
        gameId: Number(game.gameId),
        mode: Number(game.mode) as GameMode,
        currentNumber: Number(game.currentNumber),
        currentPlayer: game.currentPlayer,
        status: Number(game.status) as GameStatus,
        entryFee: ethers.formatEther(game.entryFee),
        prizePool: ethers.formatEther(game.prizePool),
        winner: game.winner,
        numberGenerated: game.numberGenerated
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return null
    }
  }

  // Get Game Players
  const getPlayers = async (gameId: number): Promise<string[]> => {
    try {
      const contracts = getContracts()
      if (!contracts) return []

      return await contracts.gameContract.getPlayers(gameId)
    } catch (error) {
      console.error('Error getting players:', error)
      return []
    }
  }

  // Get Player View - Updated to match your contract's actual return values
  const getPlayerView = async (gameId: number): Promise<PlayerView | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const view = await contracts.gameContract.getPlayerView(gameId)
      
      return {
        number: Number(view.number),
        yourTurn: view.yourTurn,
        timeLeft: Number(view.timeLeft),
        yourTimeouts: Number(view.yourTimeouts),
        opponentTimeouts: Number(view.opponentTimeouts)
      }
    } catch (error) {
      console.error('Error getting player view:', error)
      return null
    }
  }

  // Get Player Stats
  const getPlayerStats = async (address: string): Promise<PlayerStats | null> => {
    try {
      const contracts = getContracts()
      if (!contracts || !address) return null

      const stats = await contracts.gameContract.getStats(address)
      
      return {
        balance: ethers.formatEther(stats[0]),
        wins: Number(stats[1]),
        played: Number(stats[2]),
        winRate: Number(stats[3]),
        stakedAmount: ethers.formatEther(stats[4])
      }
    } catch (error) {
      console.error('Error getting player stats:', error)
      return null
    }
  }

  // Get Player Balance
  const getPlayerBalance = async (address: string): Promise<string> => {
    try {
      const contracts = getContracts()
      if (!contracts || !address) return "0"

      const balance = await contracts.gameContract.balances(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting balance:', error)
      return "0"
    }
  }

  // Get Staking Info
  const getStakingInfo = async (address: string): Promise<StakingInfo | null> => {
    try {
      const contracts = getContracts()
      if (!contracts || !address) return null

      const info = await contracts.gameContract.staking(address)
      
      return {
        amount: ethers.formatEther(info.amount),
        lastReward: Number(info.lastReward),
        rewards: ethers.formatEther(info.rewards)
      }
    } catch (error) {
      console.error('Error getting staking info:', error)
      return null
    }
  }

  // Get Game Counter
  const getGameCounter = async (): Promise<number> => {
    try {
      const contracts = getContracts()
      if (!contracts) return 0

      const counter = await contracts.gameContract.gameCounter()
      return Number(counter)
    } catch (error) {
      console.error('Error getting game counter:', error)
      return 0
    }
  }

  // Check if game is bettable
  const isGameBettable = async (gameId: number): Promise<boolean> => {
    try {
      const contracts = getContracts()
      if (!contracts) return false

      return await contracts.gameContract.isGameBettable(gameId)
    } catch (error) {
      console.error('Error checking if game is bettable:', error)
      return false
    }
  }

  // Get Game For Spectators
  const getGameForSpectators = async (gameId: number): Promise<SpectatorGameData | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const result = await contracts.gameContract.getGameForSpectators(gameId)
      
      return {
        status: Number(result.status) as GameStatus,
        winner: result.winner,
        players: result.players,
        currentNumber: Number(result.currentNumber),
        numberGenerated: result.numberGenerated,
        currentPlayer: result.currentPlayer,
        mode: Number(result.mode) as GameMode
      }
    } catch (error) {
      console.error('Error getting game for spectators:', error)
      return null
    }
  }

  // Get Platform Stats
  const getPlatformStats = async () => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const [gameCounter, platformFee, totalStaked, timeLimit, stakingAPY] = await Promise.all([
        contracts.gameContract.gameCounter(),
        contracts.gameContract.platformFee(),
        contracts.gameContract.totalStaked(),
        contracts.gameContract.timeLimit(),
        contracts.gameContract.stakingAPY()
      ])

      return {
        gameCounter: Number(gameCounter),
        platformFee: Number(platformFee),
        totalStaked: ethers.formatEther(totalStaked),
        timeLimit: Number(timeLimit),
        stakingAPY: Number(stakingAPY)
      }
    } catch (error) {
      console.error('Error getting platform stats:', error)
      return null
    }
  }

  return {
    getGame,
    getPlayers,
    getPlayerView,
    getPlayerStats,
    getPlayerBalance,
    getStakingInfo,
    getGameCounter,
    isGameBettable,
    getGameForSpectators,
    getPlatformStats
  }
}

// Hook for spectator/betting functionality
export function useSpectatorContract() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Place Bet
  const placeBet = async (gameId: number, predictedWinner: string, amount: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
      
      const tx = await contract.placeBet(GAME_CONTRACT_ADDRESS, gameId, predictedWinner, {
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
  const claimBettingWinnings = async (gameId: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
      
      const tx = await contract.claimBettingWinnings(GAME_CONTRACT_ADDRESS, gameId)
      
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

// Hook for spectator/betting data
export function useSpectatorData() {
  const config = useConfig()

  // Get contract instance
  const getSpectatorContract = () => {
    const provider = getEthersProvider(config)
    if (!provider) return null

    return new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
  }

  // Get Betting Info
  const getBettingInfo = async (gameId: number): Promise<BettingInfo | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const info = await contract.getGameBettingInfo(GAME_CONTRACT_ADDRESS, gameId)
      
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
  const getBettingOdds = async (gameId: number, players: string[]): Promise<BettingOdds | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const odds = await contract.getBettingOdds(GAME_CONTRACT_ADDRESS, gameId, players)
      
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
  const isBettingAllowed = async (gameId: number): Promise<boolean> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return false

      return await contract.isBettingAllowed(GAME_CONTRACT_ADDRESS, gameId)
    } catch (error) {
      console.error('Error checking if betting is allowed:', error)
      return false
    }
  }

  return {
    getBettingInfo,
    getBettingOdds,
    getSpectatorBalance,
    isBettingAllowed
  }
}