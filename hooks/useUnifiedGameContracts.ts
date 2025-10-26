// hooks/useUnifiedGameContracts.ts
import { useState, useEffect } from 'react'
import { useConfig } from 'wagmi'
import { ethers } from 'ethers'
import { getEthersProvider, getEthersSigner } from '@/config/adapter'
import { toast } from 'react-hot-toast'

// Import all ABIs
import { ZeroSumSimplifiedABI } from '../config/abis/ZeroSumSimplifiedABI'
import { ZeroSumHardcoreMysteryABI } from '../config/abis/ZeroSumHardcoreMysteryABI'
import { ZeroSumTournamentABI } from '../config/abis/ZeroSumTournamentABI'

// Contract addresses
// Use the same contract address as wagmi hook
import { getContractAddresses } from '@/context/wagmi-config'

// Helper function to get game contract address
const getGameContractAddress = () => {
  const { ZERO_SUM_SIMPLIFIED } = getContractAddresses()
  return ZERO_SUM_SIMPLIFIED
}
const HARDCORE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HARDCORE_MYSTERY_CONTRACT_ADDRESS || "0x2E56044dB3be726772D6E5afFD7BD813C6895025"
const TOURNAMENT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOURNAMENT_CONTRACT_ADDRESS || "0x39fdd70dc8A2C85A23A65B4775ecC3bBEa373db7"

// Unified enums matching your actual contracts
export enum UnifiedGameMode {
  // From ZeroSumSimplified
  QUICK_DRAW = 0,
  STRATEGIC = 1,
  // From ZeroSumHardcoreMystery  
  HARDCORE_MYSTERY = 2,
  LAST_STAND = 3
  // Note: PURE_MYSTERY removed - doesn't exist in game contracts
}

export enum GameStatus {
  WAITING = 0,
  ACTIVE = 1,
  FINISHED = 2
}

export enum TournamentStatus {
  REG = 0,
  ACTIVE = 1,
  FINISHED = 2,
  CANCELLED = 3
}

// Unified game interface
export interface UnifiedGame {
  gameId: number
  mode: UnifiedGameMode
  contractAddress: string
  currentNumber?: number
  currentPlayer: string
  status: GameStatus
  entryFee: string
  prizePool: string
  winner: string
  players: string[]
  maxPlayers?: number
  timeLeft?: number
  isStuck?: boolean
  moveCount?: number
  displayRange?: { min: number; max: number; hint: string }
}

export interface TournamentGame {
  id: number
  name: string
  mode: UnifiedGameMode
  entryFee: string
  prizePool: string
  maxParticipants: number
  currentParticipants: number
  status: TournamentStatus
  deadline: number
  timeLeft: number
  currentRound: number
  totalRounds: number
  winner: string
  participants?: string[] // Added for new functionality
}

// Contract mapping for different game modes
const CONTRACT_CONFIG = {
  [UnifiedGameMode.QUICK_DRAW]: {
    address: getGameContractAddress(),
    abi: ZeroSumSimplifiedABI,
    createFunction: 'createQuickDraw',
    contractMode: 0
  },
  [UnifiedGameMode.STRATEGIC]: {
    address: getGameContractAddress(),
    abi: ZeroSumSimplifiedABI,
    createFunction: 'createStrategic',
    contractMode: 1
  },
  [UnifiedGameMode.HARDCORE_MYSTERY]: {
    address: HARDCORE_CONTRACT_ADDRESS,
    abi: ZeroSumHardcoreMysteryABI,
    createFunction: 'createHardcoreMysteryGame',
    contractMode: 0
  },
  [UnifiedGameMode.LAST_STAND]: {
    address: HARDCORE_CONTRACT_ADDRESS,
    abi: ZeroSumHardcoreMysteryABI,
    createFunction: 'createLastStandGame',
    contractMode: 1
  }
}

// Main unified hook for all game interactions
export function useUnifiedGameContract() {
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Create game based on mode
  const createGame = async (mode: UnifiedGameMode, entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contractConfig = CONTRACT_CONFIG[mode]
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer)
      
      const tx = await contract[contractConfig.createFunction]({
        value: ethers.parseEther(entryFee)
      })
      
      toast.success(`Creating ${getModeName(mode)} game...`)
      const receipt = await tx.wait()
      
      // Extract game ID from events
      let gameId = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'GameCreated') {
            gameId = parsed.args[0].toString()
            break
          }
        } catch (e) {
          continue
        }
      }
      
      toast.success('Game created successfully!')
      return { success: true, gameId, txHash: tx.hash, contractAddress: contractConfig.address }
    } catch (error: any) {
      console.error('Error creating game:', error)
      toast.error(error.reason || error.message || 'Failed to create game')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Join game
  const joinGame = async (gameId: number, mode: UnifiedGameMode, entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contractConfig = CONTRACT_CONFIG[mode]
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer)
      
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

  // Make move
  const makeMove = async (gameId: number, mode: UnifiedGameMode, subtraction: number) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contractConfig = CONTRACT_CONFIG[mode]
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer)
      
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

  // Handle timeout
  const handleTimeout = async (gameId: number, mode: UnifiedGameMode) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contractConfig = CONTRACT_CONFIG[mode]
      const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer)
      
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

  // Tournament functions
  const createTournament = async (
    name: string,
    entryFee: string,
    maxParticipants: number,
    mode: UnifiedGameMode,
    hours: number
  ) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contract = new ethers.Contract(TOURNAMENT_CONTRACT_ADDRESS, ZeroSumTournamentABI, signer)
      
      // Map unified mode to tournament mode
      const tournamentMode = mode === UnifiedGameMode.HARDCORE_MYSTERY ? 3 :
                           mode === UnifiedGameMode.LAST_STAND ? 4 : mode
      
      const tx = await contract.create(
        name,
        ethers.parseEther(entryFee),
        maxParticipants,
        tournamentMode,
        hours
      )
      
      toast.success('Creating tournament...')
      const receipt = await tx.wait()
      
      let tournamentId = null
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'Created') {
            tournamentId = parsed.args[0].toString()
            break
          }
        } catch (e) {
          continue
        }
      }
      
      toast.success('Tournament created successfully!')
      return { success: true, tournamentId, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating tournament:', error)
      toast.error(error.reason || error.message || 'Failed to create tournament')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const joinTournament = async (tournamentId: number, entryFee: string) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contract = new ethers.Contract(TOURNAMENT_CONTRACT_ADDRESS, ZeroSumTournamentABI, signer)
      
      const tx = await contract.join(tournamentId, {
        value: ethers.parseEther(entryFee)
      })
      
      toast.success('Joining tournament...')
      await tx.wait()
      toast.success('Successfully joined the tournament!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error joining tournament:', error)
      toast.error(error.reason || error.message || 'Failed to join tournament')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Record match result (admin function - only owner can call)
  const recordMatchResult = async (
    tournamentId: number, 
    round: number, 
    matchIndex: number, 
    winner: string
  ) => {
    setLoading(true)
    try {
      const signer = await getEthersSigner(config)
      if (!signer) throw new Error('Please connect your wallet')

      const contract = new ethers.Contract(TOURNAMENT_CONTRACT_ADDRESS, ZeroSumTournamentABI, signer)
      
      const tx = await contract.recordResult(tournamentId, round, matchIndex, winner)
      
      toast.success('Recording match result...')
      await tx.wait()
      toast.success('Match result recorded!')
      return { success: true, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error recording match result:', error)
      toast.error(error.reason || error.message || 'Failed to record match result')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createGame,
    joinGame,
    makeMove,
    handleTimeout,
    createTournament,
    joinTournament,
    recordMatchResult
  }
}

// Hook for reading all contract data
export function useUnifiedGameData() {
  const config = useConfig()

  // Get contract instances
  const getContracts = () => {
    const provider = getEthersProvider(config)
    if (!provider) return null

    return {
      simplified: new ethers.Contract(getGameContractAddress(), ZeroSumSimplifiedABI, provider),
      hardcore: new ethers.Contract(HARDCORE_CONTRACT_ADDRESS, ZeroSumHardcoreMysteryABI, provider),
      tournament: new ethers.Contract(TOURNAMENT_CONTRACT_ADDRESS, ZeroSumTournamentABI, provider)
    }
  }

  // Get unified game data
  const getUnifiedGame = async (gameId: number, mode: UnifiedGameMode): Promise<UnifiedGame | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const contractConfig = CONTRACT_CONFIG[mode]
      const contract = contractConfig.address === getGameContractAddress() ? 
        contracts.simplified : contracts.hardcore

      // Get game data based on contract type
      if (contractConfig.address === getGameContractAddress()) {
        // ZeroSumSimplified
        const game = await contract.getGame(gameId)
        const players = await contract.getPlayers(gameId)
        const summary = await contract.getGameSummary(gameId)
        
        return {
          gameId: Number(game.gameId),
          mode,
          contractAddress: contractConfig.address,
          currentNumber: Number(game.currentNumber),
          currentPlayer: game.currentPlayer,
          status: Number(game.status) as GameStatus,
          entryFee: ethers.formatEther(game.entryFee),
          prizePool: ethers.formatEther(game.prizePool),
          winner: game.winner,
          players,
          timeLeft: Number(summary.timeLeft),
          isStuck: summary.isStuck
        }
      } else {
        // ZeroSumHardcoreMystery
        const game = await contract.getGame(gameId)
        const players = await contract.getPlayers(gameId)
        let displayRange = undefined
        
        try {
          if (game.isStarted) {
            const range = await contract.getDisplayedRange(gameId)
            displayRange = {
              min: Number(range.minRange),
              max: Number(range.maxRange),
              hint: range.hint
            }
          }
        } catch (e) {
          // Range not available yet
        }
        
        return {
          gameId: Number(game.gameId),
          mode,
          contractAddress: contractConfig.address,
          currentNumber: Number(game.actualNumber), // Always 0 for mystery
          currentPlayer: game.currentPlayer,
          status: Number(game.status) as GameStatus,
          entryFee: ethers.formatEther(game.entryFee),
          prizePool: ethers.formatEther(game.prizePool),
          winner: game.winner,
          players,
          maxPlayers: Number(game.maxPlayers),
          moveCount: Number(game.moveCount),
          displayRange
        }
      }
    } catch (error) {
      console.error('Error getting unified game:', error)
      return null
    }
  }

  // Get active tournaments
  const getActiveTournaments = async (): Promise<TournamentGame[]> => {
    try {
      const contracts = getContracts()
      if (!contracts) return []

      const tournaments: TournamentGame[] = []

      // Get the actual tournament counter instead of checking 100 IDs
      const counter = await contracts.tournament.counter()
      const totalTournaments = Number(counter)
      
      if (totalTournaments === 0) {
        return []
      }

      console.log(`🔍 Found ${totalTournaments} tournaments, loading active ones...`)

      // Only check tournaments that actually exist
      for (let i = 1; i <= totalTournaments; i++) {
        try {
          const tournament = await contracts.tournament.getTournament(i)
          if (tournament.id === 0) continue // Skip non-existent tournaments
          
          const uiInfo = await contracts.tournament.getUIInfo(i)
          const currentStatus = Number(uiInfo.status)
          
          // Only include REG and ACTIVE tournaments
          if (currentStatus === TournamentStatus.REG || currentStatus === TournamentStatus.ACTIVE) {
            let participants: string[] = []
            try {
              participants = await contracts.tournament.getParticipants(i)
            } catch (e) {
              participants = []
            }
            
            tournaments.push({
              id: Number(tournament.id),
              name: `Tournament #${tournament.id}`,
              mode: Number(tournament.mode) as UnifiedGameMode,
              entryFee: ethers.formatEther(tournament.entryFee),
              prizePool: ethers.formatEther(tournament.prizePool),
              maxParticipants: Number(tournament.maxParticipants),
              currentParticipants: Number(uiInfo.partCount),
              status: currentStatus as TournamentStatus,
              deadline: Number(tournament.deadline),
              timeLeft: Number(uiInfo.timeLeft),
              currentRound: Number(tournament.currentRound),
              totalRounds: Number(tournament.totalRounds),
              winner: tournament.winner,
              participants
            })
          }
        } catch (e) {
          console.warn(`Error loading tournament ${i}:`, e)
          break
        }
      }

      console.log(`✅ Loaded ${tournaments.length} active tournaments`)
      return tournaments
    } catch (error) {
      console.error('Error getting active tournaments:', error)
      return []
    }
  }

  // Get completed tournaments
  const getCompletedTournaments = async (): Promise<TournamentGame[]> => {
    try {
      const contracts = getContracts()
      if (!contracts) return []

      const tournaments: TournamentGame[] = []

      // Get the actual tournament counter instead of checking 100 IDs
      const counter = await contracts.tournament.counter()
      const totalTournaments = Number(counter)
      
      if (totalTournaments === 0) {
        return []
      }

      console.log(`🔍 Found ${totalTournaments} tournaments, loading completed ones...`)

      // Only check tournaments that actually exist
      for (let i = 1; i <= totalTournaments; i++) {
        try {
          const tournament = await contracts.tournament.getTournament(i)
          if (tournament.id === 0) continue // Skip non-existent tournaments
          
          const uiInfo = await contracts.tournament.getUIInfo(i)
          const currentStatus = Number(uiInfo.status)
          
          // Only include FINISHED tournaments
          if (currentStatus === TournamentStatus.FINISHED) {
            let participants: string[] = []
            try {
              participants = await contracts.tournament.getParticipants(i)
            } catch (e) {
              participants = []
            }
            
            tournaments.push({
              id: Number(tournament.id),
              name: `Tournament #${tournament.id}`,
              mode: Number(tournament.mode) as UnifiedGameMode,
              entryFee: ethers.formatEther(tournament.entryFee),
              prizePool: ethers.formatEther(tournament.prizePool),
              maxParticipants: Number(tournament.maxParticipants),
              currentParticipants: Number(uiInfo.partCount),
              status: currentStatus as TournamentStatus,
              deadline: Number(tournament.deadline),
              timeLeft: Number(uiInfo.timeLeft),
              currentRound: Number(tournament.currentRound),
              totalRounds: Number(tournament.totalRounds),
              winner: tournament.winner,
              participants
            })
          }
        } catch (e) {
          console.warn(`Error loading tournament ${i}:`, e)
          break
        }
      }

      console.log(`✅ Loaded ${tournaments.length} completed tournaments`)
      return tournaments
    } catch (error) {
      console.error('Error getting completed tournaments:', error)
      return []
    }
  }

  // Check if a user has joined a specific tournament
  const hasUserJoinedTournament = async (tournamentId: number, userAddress: string): Promise<boolean> => {
    try {
      const contracts = getContracts()
      if (!contracts || !userAddress) return false

      const participants = await contracts.tournament.getParticipants(tournamentId)
      return participants.includes(userAddress)
    } catch (error) {
      console.error('Error checking tournament participation:', error)
      return false
    }
  }

  // Get user's tournament participations
  const getUserTournaments = async (userAddress: string): Promise<number[]> => {
    try {
      const contracts = getContracts()
      if (!contracts || !userAddress) return []

      // This would require the tournament contract to have a getUserTournaments function
      // For now, we'll check all tournaments to see which ones the user has joined
      const allTournaments = await getActiveTournaments()
      const userTournaments: number[] = []

      for (const tournament of allTournaments) {
        if (tournament.participants && tournament.participants.includes(userAddress)) {
          userTournaments.push(tournament.id)
        }
      }

      return userTournaments
    } catch (error) {
      console.error('Error getting user tournaments:', error)
      return []
    }
  }

  // Get user's recent games across all contracts
  const getUserGames = async (address: string, limit: number = 10): Promise<UnifiedGame[]> => {
    try {
      const contracts = getContracts()
      if (!contracts || !address) return []

      const games: UnifiedGame[] = []

      // Get games from simplified contract
      try {
        const simplifiedGames = await contracts.simplified.getUserGames(address, 0, limit)
        for (let i = 0; i < simplifiedGames.gameIds.length; i++) {
          const gameId = Number(simplifiedGames.gameIds[i])
          const game = simplifiedGames.userGames[i]
          const players = await contracts.simplified.getPlayers(gameId)
          
          games.push({
            gameId,
            mode: Number(game.mode) as UnifiedGameMode,
            contractAddress: getGameContractAddress(),
            currentNumber: Number(game.currentNumber),
            currentPlayer: game.currentPlayer,
            status: Number(game.status) as GameStatus,
            entryFee: ethers.formatEther(game.entryFee),
            prizePool: ethers.formatEther(game.prizePool),
            winner: game.winner,
            players
          })
        }
      } catch (e) {
        console.error('Error getting simplified games:', e)
      }

      // Get games from hardcore contract (would need similar getUserGames function)
      // This would require updating the hardcore contract to have getUserGames function

      return games.sort((a, b) => b.gameId - a.gameId).slice(0, limit)
    } catch (error) {
      console.error('Error getting user games:', error)
      return []
    }
  }

  // Tournament gameplay functions
  const getTournamentBracket = async (tournamentId: number) => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const tournament = await contracts.tournament.getTournament(tournamentId)
      const participants = await contracts.tournament.getParticipants(tournamentId)
      
      const rounds = []
      for (let round = 1; round <= tournament.totalRounds; round++) {
        try {
          const matches = await contracts.tournament.getRoundMatches(tournamentId, round)
          rounds.push({
            round,
            matches: matches.map((match: any, index: number) => ({
              index,
              player1: match.p1,
              player2: match.p2,
              winner: match.winner,
              done: match.done
            }))
          })
        } catch (e) {
          // Round might not exist yet
          rounds.push({ round, matches: [] })
        }
      }

      return {
        tournament,
        participants,
        rounds,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds
      }
    } catch (error) {
      console.error('Error getting tournament bracket:', error)
      return null
    }
  }

  const getTournamentStats = async (playerAddress: string) => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      const stats = await contracts.tournament.getStats(playerAddress)
      return {
        played: Number(stats[0]),
        won: Number(stats[1]),
        earnings: ethers.formatEther(stats[2]),
        winRate: Number(stats[3])
      }
    } catch (error) {
      console.error('Error getting tournament stats:', error)
      return null
    }
  }

  // Check if user is tournament contract owner/admin
  const isTournamentAdmin = async (userAddress: string): Promise<boolean> => {
    try {
      const contracts = getContracts()
      if (!contracts || !userAddress) return false

      const owner = await contracts.tournament.owner()
      return owner.toLowerCase() === userAddress.toLowerCase()
    } catch (error) {
      console.error('Error checking tournament admin status:', error)
      return false
    }
  }

  // Check for existing games between tournament participants
  const checkForExistingTournamentGame = async (
    tournamentId: number,
    player1: string,
    player2: string,
    mode: UnifiedGameMode
  ): Promise<number | null> => {
    try {
      const contracts = getContracts()
      if (!contracts) return null

      // Check both game contracts for existing games between these players
      // This is a simplified check - you might want to implement more sophisticated logic
      
      // For now, return null to indicate no existing game found
      // You can implement actual game checking logic here
      return null
    } catch (error) {
      console.error('Error checking for existing tournament game:', error)
      return null
    }
  }

  return {
    getUnifiedGame,
    getActiveTournaments,
    getCompletedTournaments,
    getUserGames,
    hasUserJoinedTournament,
    getUserTournaments,
    getTournamentBracket,
    getTournamentStats,
    isTournamentAdmin,
    checkForExistingTournamentGame
  }
}

// Utility functions
export const getModeName = (mode: UnifiedGameMode): string => {
  switch (mode) {
    case UnifiedGameMode.QUICK_DRAW:
      return 'Quick Draw'
    case UnifiedGameMode.STRATEGIC:
      return 'Strategic'
    case UnifiedGameMode.HARDCORE_MYSTERY:
      return 'Hardcore Mystery'
    case UnifiedGameMode.LAST_STAND:
      return 'Last Stand'
    default:
      return 'Unknown'
  }
}

export const getModeDescription = (mode: UnifiedGameMode): string => {
  switch (mode) {
    case UnifiedGameMode.QUICK_DRAW:
      return 'Fast-paced: subtract only 1 each turn'
    case UnifiedGameMode.STRATEGIC:
      return 'Strategic: subtract 10-30% of current number'
    case UnifiedGameMode.HARDCORE_MYSTERY:
      return 'Mystery mode: number hidden, instant loss for overshooting'
    case UnifiedGameMode.LAST_STAND:
      return 'Battle royale: last player standing wins'
    default:
      return 'Unknown game mode'
  }
}

export const getModeIcon = (mode: UnifiedGameMode): string => {
  switch (mode) {
    case UnifiedGameMode.QUICK_DRAW:
      return '🎯'
    case UnifiedGameMode.STRATEGIC:
      return '🧠'
    case UnifiedGameMode.HARDCORE_MYSTERY:
      return '⚡'
    case UnifiedGameMode.LAST_STAND:
      return '👥'
    default:
      return '🎮'
  }
}