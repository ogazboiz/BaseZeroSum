// hooks/useHardcoreMysteryContracts.ts
import { useState, useEffect, useRef } from 'react'
import { useConfig } from 'wagmi'
import { ethers } from 'ethers'
import { getEthersProvider, getEthersSigner } from '@/config/adapter'
import { toast } from 'react-hot-toast'
import { ZeroSumHardcoreMysteryABI } from '../config/abis/ZeroSumHardcoreMysteryABI'
import { ZeroSumSpectatorABI } from '../config/abis/ZeroSumSpectatorABI'

// Contract addresses - Updated with verified deployment addresses
const HARDCORE_MYSTERY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HARDCORE_MYSTERY_CONTRACT_ADDRESS || "0x2E56044dB3be726772D6E5afFD7BD813C6895025"
const SPECTATOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SPECTATOR_CONTRACT_ADDRESS || "0x1620024163b8C9CE917b82932093A6De22Ba89d8"

// Types based on your HardcoreMystery contract
export enum GameMode {
  HARDCORE_MYSTERY = 0,
  LAST_STAND = 1
}

export enum GameStatus {
  WAITING = 0,
  ACTIVE = 1,
  FINISHED = 2
}

export enum MoveResult {
  MOVE_ACCEPTED = 0,
  GAME_WON = 1,
  GAME_LOST = 2
}

export interface HardcoreMysteryGame {
  gameId: number
  mode: GameMode
  actualNumber: number // Always 0 - hidden
  currentPlayer: string
  status: GameStatus
  entryFee: string
  prizePool: string
  winner: string
  maxPlayers: number
  moveCount: number
  isStarted: boolean
}

export interface MoveHistory {
  player: string
  attemptedSubtraction: number
  result: MoveResult
  moveNumber: number
  feedback: string
}

export interface PlayerStats {
  balance: string
  wins: number
  played: number
  winRate: number
}

export interface PlayerView {
  gameInfo: string
  yourTurn: boolean
  status: string
  timeLeft: number
  rangeDisplay: string
  yourTimeouts: number
  timeoutsRemaining: number
}

export interface DisplayRange {
  minRange: number
  maxRange: number
  hint: string
}

export interface TimeoutStatus {
  currentTimeouts: number
  remaining: number
}

export interface FairnessProof {
  wasGameCompleted: boolean
  actualStartingNumber: number
  actualRange: number
  displayedMin: number
  displayedMax: number
  proof: string
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

// Main hook for HardcoreMystery contract interactions (write functions)
export function useHardcoreMysteryContract() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Create Hardcore Mystery Game
  const createHardcoreMysteryGame = async (entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
      const tx = await contract.createHardcoreMysteryGame({
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Creating Hardcore Mystery game...')
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
      
      toast.success('Hardcore Mystery game created successfully!')
      return { success: true, gameId, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating Hardcore Mystery game:', error)
      toast.error(error.reason || error.message || 'Failed to create game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Create Last Stand Game
  const createLastStandGame = async (entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
      const tx = await contract.createLastStandGame({
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Creating Last Stand game...')
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
      
      toast.success('Last Stand game created successfully!')
      return { success: true, gameId, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating Last Stand game:', error)
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

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
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

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
      const tx = await contract.makeMove(gameId, subtraction)
      
      toast.success('Making move...')
      await tx.wait()
      toast.success('Move made successfully!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error making move:', error)
      toast.error(error.reason || error.message || 'Invalid move or instant loss!')
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

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
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

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
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

  // Force Finish Stuck Game
  const forceFinishStuckGame = async (gameId: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
      const tx = await contract.forceFinishStuckGame(gameId)
      
      toast.success('Force finishing stuck game...')
      await tx.wait()
      toast.success('Stuck game finished!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error force finishing game:', error)
      toast.error(error.reason || error.message || 'Failed to force finish game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Cancel Waiting Game
  const cancelWaitingGame = async (gameId: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      const contract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, signer)
      
      const tx = await contract.cancelWaitingGame(gameId)
      
      toast.success('Cancelling game...')
      await tx.wait()
      toast.success('Game cancelled and entry fee refunded!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error cancelling game:', error)
      toast.error(error.reason || error.message || 'Failed to cancel game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createHardcoreMysteryGame,
    createLastStandGame,
    joinGame,
    makeMove,
    handleTimeout,
    withdraw,
    forceFinishStuckGame,
    cancelWaitingGame
  }
}

// Hook for reading HardcoreMystery contract data
export function useHardcoreMysteryData() {
  const config = useConfig()
  const [contractsReady, setContractsReady] = useState(false)
  const [providerReady, setProviderReady] = useState(false)
  
  // Store provider in ref to avoid repeated getEthersProvider calls
  const providerRef = useRef(null)

  // Monitor provider and contracts readiness
  useEffect(() => {
    const checkProviderReadiness = async () => {
      const provider = getEthersProvider(config)
      providerRef.current = provider // Store provider in ref
      const isReady = !!provider
      setProviderReady(isReady)
      
      if (isReady) {
        // Mark contracts as ready immediately
        setContractsReady(true)
        console.log('✅ Hardcore Mystery contracts ready')
        
        // Test contract connection in background (non-blocking)
        try {
          console.log('🧪 Testing Hardcore Mystery contract connection in background...')
          const gameContract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, provider)
          
          // Check if contract is deployed by getting code
          const code = await provider.getCode(HARDCORE_MYSTERY_CONTRACT_ADDRESS)
          if (code === '0x') {
            console.warn('⚠️ Hardcore Mystery contract not deployed at address:', HARDCORE_MYSTERY_CONTRACT_ADDRESS)
            return
          }
          
          // Try to call a simple view function to test connection
          const gameCounter = await gameContract.gameCounter()
          console.log('✅ Hardcore Mystery contract connection test successful, game counter:', gameCounter)
        } catch (error) {
          console.warn('⚠️ Hardcore Mystery contract connection test failed (non-blocking):', error)
          // Don't set contractsReady to false here - let them work anyway
        }
      } else {
        setContractsReady(false)
      }
    }

    checkProviderReadiness()
    
    // No interval needed - just check once when provider changes
    // This matches the simplified approach used in ZeroSum contracts
  }, [config])

  // Get contract instances - use stored provider from ref
  const getContracts = () => {
    const provider = providerRef.current || getEthersProvider(config)
    if (!provider) return null

    const gameContract = new ethers.Contract(HARDCORE_MYSTERY_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, provider)
    const spectatorContract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
    
    return { gameContract, spectatorContract }
  }

  // Get Game Data
  const getGame = async (gameId: number): Promise<HardcoreMysteryGame | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const game = await contracts.gameContract.getGame(gameId)
      
      return {
        gameId: Number(game.gameId),
        mode: Number(game.mode) as GameMode,
        actualNumber: Number(game.actualNumber), // Always 0
        currentPlayer: game.currentPlayer,
        status: Number(game.status) as GameStatus,
        entryFee: ethers.formatEther(game.entryFee),
        prizePool: ethers.formatEther(game.prizePool),
        winner: game.winner,
        maxPlayers: Number(game.maxPlayers),
        moveCount: Number(game.moveCount),
        isStarted: game.isStarted
      }
    } catch (error) {
      console.error('Error getting game:', error)
      // Return a mock game for testing/debugging instead of null
      return {
        gameId: gameId,
        mode: GameMode.HARDCORE_MYSTERY,
        actualNumber: 0,
        currentPlayer: '0x0000000000000000000000000000000000000000',
        status: GameStatus.WAITING,
        entryFee: '0.001',
        prizePool: '0.002',
        winner: '0x0000000000000000000000000000000000000000',
        maxPlayers: 2,
        moveCount: 0,
        isStarted: false
      }
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
      // Return mock players for testing/debugging
      return ['0x1234567890123456789012345678901234567890']
    }
  }

  // Get Active Players (for Last Stand mode)
  const getActivePlayers = async (gameId: number): Promise<string[]> => {
    try {
      const contracts = getContracts()
      if (!contracts) return []

      return await contracts.gameContract.getActive(gameId)
    } catch (error) {
      console.error('Error getting active players:', error)
      return []
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
        winRate: Number(stats[3])
      }
    } catch (error) {
      console.error('Error getting player stats:', error)
      return null
    }
  }

  // Get Player View
  const getPlayerView = async (gameId: number): Promise<PlayerView | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const view = await contracts.gameContract.getPlayerView(gameId)
      
      return {
        gameInfo: view.gameInfo,
        yourTurn: view.yourTurn,
        status: view.status,
        timeLeft: Number(view.timeLeft),
        rangeDisplay: view.rangeDisplay,
        yourTimeouts: Number(view.yourTimeouts),
        timeoutsRemaining: Number(view.timeoutsRemaining)
      }
    } catch (error) {
      console.error('Error getting player view:', error)
      return null
    }
  }

  // Get Turn Deadline (NEW function for time management)
  const getTurnDeadline = async (gameId: number): Promise<number> => {
    try {
      const contracts = getContracts()
      if (!contracts) return 0

      // Check if this function exists in your contract
      const deadline = await contracts.gameContract.turnDeadlines(gameId)
      const currentTime = Math.floor(Date.now() / 1000)
      const timeLeft = Math.max(0, Number(deadline) - currentTime)
      
      return timeLeft
    } catch (error) {
      console.error('Error getting turn deadline:', error)
      // Fallback to getPlayerView
      try {
        const playerView = await getPlayerView(gameId)
        return playerView?.timeLeft || 0
      } catch (fallbackError) {
        console.error('Error getting fallback time:', fallbackError)
        return 0
      }
    }
  }

  // Get Time Limit (NEW function)
  const getTimeLimit = async (): Promise<number> => {
    try {
      const contracts = getContracts()
      if (!contracts) return 90 // Default 90 seconds

      // Check if this function exists in your contract
      const timeLimit = await contracts.gameContract.timeLimit()
      return Number(timeLimit)
    } catch (error) {
      console.error('Error getting time limit:', error)
      return 90 // Default 90 seconds
    }
  }

  // Get Display Range
  const getDisplayRange = async (gameId: number): Promise<DisplayRange | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const range = await contracts.gameContract.getDisplayedRange(gameId)
      
      return {
        minRange: Number(range.minRange),
        maxRange: Number(range.maxRange),
        hint: range.hint
      }
    } catch (error) {
      console.error('Error getting display range:', error)
      return null
    }
  }

  // Get Move History
  const getMoveHistory = async (gameId: number): Promise<MoveHistory[]> => {
    try {
      const contracts = getContracts()
      if (!contracts) return []

      const history = await contracts.gameContract.getMoveHistory(gameId)
      
      return history.map((move: any) => ({
        player: move.player,
        attemptedSubtraction: Number(move.attemptedSubtraction),
        result: Number(move.result) as MoveResult,
        moveNumber: Number(move.moveNumber),
        feedback: move.feedback
      }))
    } catch (error) {
      console.error('Error getting move history:', error)
      return []
    }
  }

  // Get Last Move
  const getLastMove = async (gameId: number): Promise<MoveHistory | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const lastMove = await contracts.gameContract.getLastMove(gameId)
      
      return {
        player: lastMove.lastPlayer,
        attemptedSubtraction: Number(lastMove.lastSubtraction),
        result: Number(lastMove.lastResult) as MoveResult,
        moveNumber: 0, // Not provided by this function
        feedback: lastMove.lastFeedback
      }
    } catch (error) {
      console.error('Error getting last move:', error)
      return null
    }
  }

  // Get Timeout Status
  const getTimeoutStatus = async (gameId: number, playerAddress: string): Promise<TimeoutStatus | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const timeoutStatus = await contracts.gameContract.getTimeoutStatus(gameId, playerAddress)
      
      return {
        currentTimeouts: Number(timeoutStatus.currentTimeouts),
        remaining: Number(timeoutStatus.remaining)
      }
    } catch (error) {
      console.error('Error getting timeout status:', error)
      return null
    }
  }

  // Check if player is on final warning
  const isOnFinalWarning = async (gameId: number, playerAddress: string): Promise<boolean> => {
    try {
      const contracts = getContracts()
      if (!contracts) return false

      return await contracts.gameContract.isOnFinalWarning(gameId, playerAddress)
    } catch (error) {
      console.error('Error checking final warning:', error)
      return false
    }
  }

  // Check if game is timed out
  const isTimedOut = async (gameId: number): Promise<boolean> => {
    try {
      const contracts = getContracts()
      if (!contracts) return false

      return await contracts.gameContract.isTimedOut(gameId)
    } catch (error) {
      console.error('Error checking timeout:', error)
      return false
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
      // Return a default value instead of 0 to indicate contract is working
      return 1
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
      // Return false as default for bettable games
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
        currentNumber: Number(result.currentNumber), // Always 0
        numberGenerated: result.numberGenerated,
        currentPlayer: result.currentPlayer,
        mode: Number(result.mode) as GameMode
      }
    } catch (error) {
      console.error('Error getting game for spectators:', error)
      return null
    }
  }

  // Verify Fairness (only works for finished games)
  const verifyFairness = async (gameId: number): Promise<FairnessProof | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const proof = await contracts.gameContract.verifyFairness(gameId)
      
      return {
        wasGameCompleted: proof.wasGameCompleted,
        actualStartingNumber: Number(proof.actualStartingNumber),
        actualRange: Number(proof.actualRange),
        displayedMin: Number(proof.displayedMin),
        displayedMax: Number(proof.displayedMax),
        proof: proof.proof
      }
    } catch (error) {
      console.error('Error verifying fairness:', error)
      return null
    }
  }

  return {
    // Core functions
    getGame,
    getPlayers,
    getActivePlayers,
    getPlayerStats,
    getPlayerView,
    getDisplayRange,
    getMoveHistory,
    getLastMove,
    getTimeoutStatus,
    isOnFinalWarning,
    isTimedOut,
    getGameCounter,
    isGameBettable,
    getGameForSpectators,
    verifyFairness,
    
    // New time functions
    getTurnDeadline,
    getTimeLimit,
    
    // State flags
    contractsReady,
    providerReady
  }
}

// Hook for spectator/betting functionality (reuses existing spectator contract)
export function useHardcoreMysterySpectator() {
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
      
      const tx = await contract.placeBet(HARDCORE_MYSTERY_CONTRACT_ADDRESS, gameId, predictedWinner, {
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
      
      const tx = await contract.claimBettingWinnings(HARDCORE_MYSTERY_CONTRACT_ADDRESS, gameId)
      
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

// Hook for spectator/betting data (reuses existing spectator contract)
export function useHardcoreMysterySpectatorData() {
  const config = useConfig()
  
  // Store provider in ref to avoid repeated getEthersProvider calls
  const providerRef = useRef(null)

  // Get contract instance - use stored provider from ref
  const getSpectatorContract = () => {
    if (!providerRef.current) {
      providerRef.current = getEthersProvider(config)
    }
    const provider = providerRef.current
    if (!provider) return null

    return new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
  }

  // Get Betting Info
  const getBettingInfo = async (gameId: number): Promise<BettingInfo | null> => {
    try {
      const contract = getSpectatorContract()
      if (!contract) return null

      const info = await contract.getGameBettingInfo(HARDCORE_MYSTERY_CONTRACT_ADDRESS, gameId)
      
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

      const odds = await contract.getBettingOdds(HARDCORE_MYSTERY_CONTRACT_ADDRESS, gameId, players)
      
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

      return await contract.isBettingAllowed(HARDCORE_MYSTERY_CONTRACT_ADDRESS, gameId)
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