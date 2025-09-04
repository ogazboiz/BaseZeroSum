// hooks/useZeroSumContracts.ts - Your Original Ethers.js Pattern!
import { useState, useEffect, useCallback, useRef } from 'react'
import { useConfig, useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getProvider, getContract, getViemWalletClient, getViemClient } from '@/config/adapter'
import { 
  parseEther, 
  formatEther, 
  getContract as viemGetContract, 
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient
} from 'viem'
import { toast } from 'react-hot-toast'
import { ZeroSumSimplifiedABI } from '../config/abis/ZeroSumSimplifiedABI'
import { ZeroSumSpectatorABI } from '../config/abis/ZeroSumSpectatorABI'

// Contract addresses - Base Sepolia
const GAME_CONTRACT_ADDRESS =  "0x11bb298BBde9fFa6747ea104C2c39b3E59a399B4"
const SPECTATOR_CONTRACT_ADDRESS =  "0x214124ae23b415b3AEA3bb9e260A56dc022bAf04"

// Safe formatEther function to handle potential errors
const safeFormatEther = (value: any): string => {
  try {
    if (!value || value === 0 || value === '0') return "0"
    
    // Handle RangeError specifically
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'BigNumber') {
      // Convert BigNumber to string first
      const stringValue = value.toString()
      return ethers.formatEther(stringValue)
    }
    
    return ethers.formatEther(value)
  } catch (error) {
    console.error('Error formatting ether value:', error, 'Value:', value, 'Type:', typeof value)
    
    // If it's a RangeError, return "0" and log it specifically
    if (error instanceof Error && error.message.includes('out of result range')) {
      console.warn('RangeError in safeFormatEther - user may not be in game')
      return "0"
    }
    
    return "0"
  }
}

// Types
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
  gameStuck: boolean
  stuckPlayer: string
}

export interface StakingInfo {
  amount: string
  lastReward: number
  rewards: string
}

export interface GameSummary {
  gameId: number
  mode: GameMode
  status: GameStatus
  currentNumber: number
  currentPlayer: string
  winner: string
  entryFee: string
  prizePool: string
  players: string[]
  numberGenerated: boolean
  timeLeft: number
  isStuck: boolean
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

// Provider hook with connection state management - Your Original Pattern!
export function useContractProvider() {
  const config = useConfig()
  const { isConnected, address } = useAccount()
  const [providerReady, setProviderReady] = useState(false)
  const providerRef = useRef<any>(null)
  
  useEffect(() => {
    console.log('🔗 Initializing ethers provider...')
    
    const initProvider = async () => {
      try {
        // Use your original simple pattern
        const provider = getProvider()
        if (provider) {
          providerRef.current = provider
          setProviderReady(true)
          console.log('✅ Ethers provider ready')
        } else {
          setProviderReady(false)
          console.log('❌ Provider not available')
        }
      } catch (error) {
        console.error('Provider initialization error:', error)
        setProviderReady(false)
      }
    }
    
    initProvider()
  }, [])
  
  const getProviderInstance = useCallback(() => {
    return providerRef.current
  }, [])
  
  const getWalletClient = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    try {
      // Use viem wallet client for write operations
      const walletClient = await getViemWalletClient(config)
      console.log('✅ Viem wallet client obtained for write operations')
      return walletClient
    } catch (error) {
      console.error('❌ Failed to get wallet client:', error)
      throw error
    }
  }, [isConnected, address, config])
  
  return {
    providerReady,
    isConnected,
    address,
    getProvider: getProviderInstance,
    getWalletClient
  }
}

// Main hook for contract interactions (write functions)
export function useZeroSumContract() {
  const { getWalletClient } = useContractProvider()
  const { getContracts } = useZeroSumData()
  const config = useConfig()
  const [loading, setLoading] = useState(false)

  // Generic transaction handler with better error handling
  const executeTransaction = async (
    contractCall: () => Promise<Hash>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    setLoading(true)
    try {
      const walletClient = await getWalletClient()
      
      if (!walletClient) {
        throw new Error('Please connect your wallet')
      }

      toast.success(loadingMessage)
      const hash = await contractCall()
      
      console.log(`Transaction sent: ${hash}`)
      
      // Wait for transaction receipt using public client
      const publicClient = getViemClient(config)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(`Transaction confirmed: ${receipt.transactionHash}`)
      
      // Extract relevant event data if needed
      let gameId = null
      console.log('🔍 Parsing transaction logs for GameCreated event...')
      console.log('📋 Receipt logs:', receipt.logs)
      
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === GAME_CONTRACT_ADDRESS.toLowerCase()) {
            console.log('🎯 Found log from game contract:', log)
            console.log('📋 Log topics:', log.topics)
            
            // GameCreated event signature: GameCreated(uint256 indexed gameId, uint8 mode, address creator, uint256 entryFee)
            // The gameId is in the first topic (indexed parameter)
            if (log.topics && log.topics.length > 1) {
              // First topic is the event signature, second topic is the indexed gameId
              const gameIdHex = log.topics[1]
              if (gameIdHex) {
                gameId = parseInt(gameIdHex, 16)
                console.log('✅ Extracted gameId from indexed topic:', gameId)
                break
              }
            }
          }
        } catch (e) {
          console.log('⚠️ Error parsing log:', e)
        }
      }
      
      // If we couldn't extract gameId from logs, try to get it from the latest game counter
      if (!gameId) {
        try {
          console.log('🔍 Could not extract gameId from logs, trying to get latest game counter...')
          const contracts = getContracts()
          if (contracts) {
            const counter = await contracts.gameContract.gameCounter()
            gameId = Number(counter) - 1 // The game we just created should be the previous one
            console.log('✅ Got gameId from game counter:', gameId)
          }
        } catch (e) {
          console.log('⚠️ Could not get game counter:', e)
        }
      }
      
      toast.success(successMessage)
      return { success: true, txHash: hash, receipt, gameId }
    } catch (error: any) {
      console.error('Transaction failed:', error)
      
      let errorMsg = errorMessage
      
      if (error.shortMessage) {
        errorMsg = error.shortMessage
      } else if (error.message) {
        if (error.message.includes('User rejected')) {
          errorMsg = 'Transaction cancelled by user'
        } else if (error.message.includes('insufficient funds')) {
          errorMsg = 'Insufficient funds for transaction'
        } else if (error.message.includes('execution reverted')) {
          const match = error.message.match(/execution reverted: (.+)/)
          if (match) {
            errorMsg = match[1]
          }
        }
      }
      
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const createQuickDraw = async (entryFee: string) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as Address,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.createQuickDraw({
          value: parseEther(entryFee),
          account: walletClient.account
        })
      },
      'Creating Quick Draw game...',
      'Quick Draw game created successfully!',
      'Failed to create Quick Draw game'
    )
  }

  const createStrategic = async (entryFee: string) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as Address,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.createStrategic({
          value: parseEther(entryFee),
          account: walletClient.account
        })
      },
      'Creating Strategic game...',
      'Strategic game created successfully!',
      'Failed to create Strategic game'
    )
  }

  const joinGame = async (gameId: number, entryFee: string) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as Address,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.joinGame([BigInt(gameId)], {
          value: parseEther(entryFee),
          account: walletClient.account
        })
      },
      'Joining game...',
      'Successfully joined the game!',
      'Failed to join game'
    )
  }

  const makeMove = async (gameId: number, subtraction: number) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as Address,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        console.log(`Making move: gameId=${gameId}, subtraction=${subtraction}`)
        return await contract.write.makeMove([BigInt(gameId), BigInt(subtraction)], {
          account: walletClient.account
        })
      },
      'Submitting move...',
      'Move submitted successfully!',
      'Failed to submit move'
    )
  }

  const handleTimeout = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.handleTimeout([gameId])
      },
      'Processing timeout...',
      'Timeout handled successfully!',
      'Failed to handle timeout'
    )
  }

  const cancelWaitingGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.cancelWaitingGame([gameId])
      },
      'Cancelling game...',
      'Game cancelled successfully!',
      'Failed to cancel game'
    )
  }

  const forceFinishInactiveGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.forceFinishInactiveGame([gameId])
      },
      'Force finishing stuck game...',
      'Game finished successfully!',
      'Failed to force finish game'
    )
  }

  const withdraw = async () => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.withdraw()
      },
      'Withdrawing balance...',
      'Balance withdrawn successfully!',
      'Failed to withdraw'
    )
  }

  const stake = async (amount: string) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.stake({
          value: parseEther(amount)
        })
      },
      'Staking ETH...',
      'ETH staked successfully!',
      'Failed to stake'
    )
  }

  const unstake = async (amount: string) => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.unstake([parseEther(amount)])
      },
      'Unstaking ETH...',
      'ETH unstaked successfully!',
      'Failed to unstake'
    )
  }

  const claimRewards = async () => {
    return executeTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: GAME_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSimplifiedABI,
          client: walletClient
        })
        
        return await contract.write.claimRewards()
      },
      'Claiming rewards...',
      'Rewards claimed successfully!',
      'Failed to claim rewards'
    )
  }

  return {
    loading,
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
    claimRewards
  }
}

// Hook for reading contract data
export function useZeroSumData() {
  const { providerReady, getProvider, isConnected, address } = useContractProvider()
  const [contractsReady, setContractsReady] = useState(false)
  const contractsRef = useRef<{ gameContract: any; spectatorContract: any } | null>(null)

  // Initialize contracts when provider is ready
  useEffect(() => {
    console.log('🔗 Contract initialization effect:', { providerReady, isConnected, address })
    
    if (providerReady) {
      const provider = getProvider()
      console.log('📡 Provider available:', !!provider)
      
      if (provider) {
        try {
          console.log('🏗️ Contract addresses:', { GAME_CONTRACT_ADDRESS, SPECTATOR_CONTRACT_ADDRESS })
          
          // Use your original simple pattern
          const gameContract = getContract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI)
          const spectatorContract = getContract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI)
          
          contractsRef.current = { gameContract, spectatorContract }
          setContractsReady(true)
          console.log('✅ Contracts initialized and ready')
        } catch (error) {
          console.error('❌ Contract initialization failed:', error)
          setContractsReady(false)
        }
      }
    } else {
      console.log('⏳ Provider not ready yet, waiting...')
      setContractsReady(false)
      contractsRef.current = null
    }
  }, [providerReady, getProvider])

  const getContracts = useCallback(() => {
    if (!contractsReady || !contractsRef.current) {
      console.log('⚠️ Contracts not ready yet')
      return null
    }
    return contractsRef.current
  }, [contractsReady])

  // Enhanced error handling for read functions with RPC rate limiting
  const safeContractCall = async <T>(
    contractCall: () => Promise<T>,
    defaultValue: T,
    errorContext: string,
    requiresConnection = false
  ): Promise<T> => {
    try {
      if (requiresConnection && (!isConnected || !address)) {
        console.log(`⚠️ ${errorContext}: Connection required but not available`)
        return defaultValue
      }

      if (!contractsReady) {
        console.log(`⚠️ ${errorContext}: Contracts not ready`)
        return defaultValue
      }

      const result = await contractCall()
      console.log(`✅ ${errorContext}:`, result)
      return result
    } catch (error) {
      console.error(`❌ ${errorContext}:`, error)
      
      // Check if it's an RPC rate limit error
      if (error instanceof Error && error.message.includes('Batch of more than 3 requests are not allowed')) {
        console.warn(`⚠️ RPC rate limit hit for ${errorContext}, will retry with delay`)
        // Add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
          const retryResult = await contractCall()
          console.log(`✅ ${errorContext} retry successful:`, retryResult)
          return retryResult
        } catch (retryError) {
          console.error(`❌ ${errorContext} retry failed:`, retryError)
          return defaultValue
        }
      }
      
      return defaultValue
    }
  }

  // Enhanced getUserGames with fallback
  const getUserGames = useCallback(async (
    userAddress: string, 
    fromGameId: number = 0, 
    limit: number = 50
  ): Promise<{ gameIds: number[], games: GameData[] }> => {
    if (!userAddress) {
      console.log('❌ getUserGames: No user address provided')
      return { gameIds: [], games: [] }
    }

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        console.log(`🔍 Calling getUserGames with:`, {
          userAddress,
          fromGameId,
          limit,
          contractAddress: GAME_CONTRACT_ADDRESS
        })

        // First try getUserGames method
        try {
          const result = await contracts.gameContract.getUserGames(userAddress, fromGameId, limit)
          
          console.log(`📊 Raw getUserGames result:`, {
            gameIds: result.gameIds,
            userGames: result.userGames,
            gameIdsLength: result.gameIds?.length,
            userGamesLength: result.userGames?.length
          })
          
          const gameIds = (result.gameIds || []).map((id: any) => Number(id))
          const games = (result.userGames || []).map((game: any) => {
            console.log(`🎮 Processing game from contract:`, game)
            
            return {
              gameId: Number(game.gameId),
              mode: Number(game.mode) as GameMode,
              currentNumber: Number(game.currentNumber),
              currentPlayer: game.currentPlayer,
              status: Number(game.status) as GameStatus,
              entryFee: safeFormatEther(game.entryFee),
              prizePool: safeFormatEther(game.prizePool),
              winner: game.winner || '0x0000000000000000000000000000000000000000',
              numberGenerated: Boolean(game.numberGenerated)
            }
          })

          console.log(`✅ Processed getUserGames result:`, {
            gameIds,
            gamesCount: games.length,
            games: games.map(g => ({ id: g.gameId, status: g.status, mode: g.mode }))
          })

          return { gameIds, games }
        } catch (contractError: any) {
          console.error(`❌ getUserGames contract call failed:`, contractError)
          
          // Fallback: Manual search if getUserGames fails
          console.log(`🔧 Falling back to manual search...`)
          return await manualUserGameSearch(contracts.gameContract, userAddress, limit)
        }
      },
      { gameIds: [], games: [] },
      `getUserGames(${userAddress}, ${fromGameId}, ${limit})`
    )
  }, [getContracts, contractsReady])

  // Helper function for manual game search fallback
  const manualUserGameSearch = async (
    gameContract: any, 
    userAddress: string, 
    limit: number
  ): Promise<{ gameIds: number[], games: GameData[] }> => {
    try {
      console.log(`🔍 Manual search for user games: ${userAddress}`)
      
      const gameCounter = await gameContract.gameCounter()
      const totalGames = Number(gameCounter)
      
      console.log(`📊 Total games to search: ${totalGames - 1} (from 1 to ${totalGames - 1})`)
      
      const userGames: GameData[] = []
      const gameIds: number[] = []
      
      // Search recent games first (like the contract does)
      const startFrom = Math.max(1, totalGames - Math.min(limit * 2, 50))
      
      for (let gameId = totalGames - 1; gameId >= startFrom && userGames.length < limit; gameId--) {
        try {
          console.log(`🔍 Manual check: Game ${gameId}`)
          
          // Check isInGame mapping directly
          const isInGameDirect = await gameContract.isInGame(gameId, userAddress)
          console.log(`🎯 Game ${gameId}: isInGame[${gameId}][${userAddress}] = ${isInGameDirect}`)
          
          if (isInGameDirect) {
            console.log(`✅ Found user in game ${gameId} via isInGame mapping`)
            
            const gameData = await gameContract.getGame(gameId)
            const processedGame: GameData = {
              gameId: Number(gameData.gameId),
              mode: Number(gameData.mode) as GameMode,
              currentNumber: Number(gameData.currentNumber),
              currentPlayer: gameData.currentPlayer,
              status: Number(gameData.status) as GameStatus,
              entryFee: safeFormatEther(gameData.entryFee),
              prizePool: safeFormatEther(gameData.prizePool),
              winner: gameData.winner || '0x0000000000000000000000000000000000000000',
              numberGenerated: Boolean(gameData.numberGenerated)
            }
            
            userGames.push(processedGame)
            gameIds.push(gameId)
            
            console.log(`📝 Added game ${gameId} to user games list`)
          } else {
            // Double-check with getPlayers
            const players = await gameContract.getPlayers(gameId)
            const isInPlayers = players.some((player: string) => 
              player.toLowerCase() === userAddress.toLowerCase()
            )
            
            if (isInPlayers) {
              console.log(`⚠️ Found user in game ${gameId} via getPlayers but not in isInGame mapping!`)
              
              const gameData = await gameContract.getGame(gameId)
              const processedGame: GameData = {
                gameId: Number(gameData.gameId),
                mode: Number(gameData.mode) as GameMode,
                currentNumber: Number(gameData.currentNumber),
                currentPlayer: gameData.currentPlayer,
                status: Number(gameData.status) as GameStatus,
                entryFee: ethers.formatEther(gameData.entryFee || 0),
                prizePool: ethers.formatEther(gameData.prizePool || 0),
                winner: gameData.winner || '0x0000000000000000000000000000000000000000',
                numberGenerated: Boolean(gameData.numberGenerated)
              }
              
              userGames.push(processedGame)
              gameIds.push(gameId)
              
              console.log(`📝 Added game ${gameId} to user games list (via getPlayers)`)
            }
          }
        } catch (gameError) {
          console.error(`❌ Error checking game ${gameId}:`, gameError)
        }
      }
      
      console.log(`🎯 Manual search complete:`, {
        searchedGames: totalGames - startFrom,
        foundGames: userGames.length,
        gameIds
      })
      
      return { gameIds, games: userGames }
    } catch (error) {
      console.error(`❌ Manual search failed:`, error)
      return { gameIds: [], games: [] }
    }
  }

  // Get Game Data with better validation
  const getGame = useCallback(async (gameId: number): Promise<GameData | null> => {
    if (!gameId || gameId < 1) {
      console.log('❌ Invalid game ID:', gameId)
      return null
    }
  
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')
  
        console.log(`🔍 Fetching game data for ID: ${gameId}`)
        
        const gameCounter = await contracts.gameContract.gameCounter()
        const totalGames = Number(gameCounter)
        
        console.log(`📊 Contract game counter: ${totalGames}`)
        console.log(`🎯 Requested game ID: ${gameId}`)
        
        if (gameId >= totalGames) {
          console.error(`❌ Game #${gameId} doesn't exist. Latest game: ${totalGames-1}`)
          throw new Error(`Game #${gameId} doesn't exist. Latest game: ${totalGames-1}`)
        }
        
        console.log(`✅ Game #${gameId} is valid, fetching...`)
        
        let game
        try {
          game = await contracts.gameContract.getGame(gameId)
        } catch (error) {
          if (error instanceof Error && error.message.includes('out of result range')) {
            console.warn(`⚠️ RangeError when fetching game #${gameId} - user may not be authorized to view this game`)
            throw new Error('out of result range')
          }
          throw error
        }
        
        if (!game || Number(game.gameId) === 0) {
          console.error(`❌ Game #${gameId} returned invalid data`)
          throw new Error(`Game #${gameId} not found`)
        }
        
        const gameData: GameData = {
          gameId: Number(game.gameId),
          mode: Number(game.mode) as GameMode,
          currentNumber: Number(game.currentNumber),
          currentPlayer: game.currentPlayer,
          status: Number(game.status) as GameStatus,
          entryFee: safeFormatEther(game.entryFee),
          prizePool: safeFormatEther(game.prizePool),
          winner: game.winner,
          numberGenerated: game.numberGenerated
        }
        
        console.log(`✅ Successfully fetched game #${gameId}:`, gameData)
        return gameData
      },
      null,
      `getGame(${gameId})`
    )
  }, [getContracts, contractsReady])

  const getPlayers = useCallback(async (gameId: number): Promise<string[]> => {
    if (gameId < 1) {
      console.log('❌ Invalid game ID for getPlayers:', gameId)
      return []
    }

    console.log(`🔍 Fetching players for game ${gameId}...`)
    
    try {
      const contracts = getContracts()
      if (!contracts) {
        console.error('❌ Contracts not ready for getPlayers')
        return []
      }

      console.log(`📞 Calling getPlayers(${gameId}) on contract...`)
      const players = await contracts.gameContract.getPlayers(gameId)
      console.log(`👥 Raw players data for game ${gameId}:`, players)
      
      // Ensure we return an array
      const playerArray = Array.isArray(players) ? players : []
      console.log(`👥 Processed players array for game ${gameId}:`, playerArray)
      
      return playerArray
    } catch (error) {
      console.error(`❌ Error fetching players for game ${gameId}:`, error)
      if (error instanceof Error && error.message.includes('out of result range')) {
        console.warn(`⚠️ RangeError when fetching players for game #${gameId} - user may not be authorized to view this game`)
        return []
      }
      return []
    }
  }, [getContracts, contractsReady])

  // Enhanced Player View with new fields
  const getPlayerView = useCallback(async (gameId: number): Promise<PlayerView | null> => {
    if (gameId < 1) {
      console.log('❌ Invalid game ID for getPlayerView:', gameId)
      return null
    }

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const view = await contracts.gameContract.getPlayerView(gameId)
        
        const playerView: PlayerView = {
          number: Number(view.number),
          yourTurn: view.yourTurn,
          timeLeft: Number(view.timeLeft),
          yourTimeouts: Number(view.yourTimeouts),
          opponentTimeouts: Number(view.opponentTimeouts),
          gameStuck: view.gameStuck || false,
          stuckPlayer: view.stuckPlayer || '0x0000000000000000000000000000000000000000'
        }
        
        console.log(`🎯 Enhanced player view for game ${gameId}:`, playerView)
        return playerView
      },
      null,
      `getPlayerView(${gameId})`,
      true
    )
  }, [getContracts, contractsReady, isConnected, address])

  // Get Game Summary in one call
  const getGameSummary = useCallback(async (gameId: number): Promise<GameSummary | null> => {
    if (gameId < 1) {
      console.log('❌ Invalid game ID for getGameSummary:', gameId)
      return null
    }

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const summary = await contracts.gameContract.getGameSummary(gameId)
        
        return {
          gameId: Number(summary.gameId),
          mode: Number(summary.mode) as GameMode,
          status: Number(summary.status) as GameStatus,
          currentNumber: Number(summary.currentNumber),
          currentPlayer: summary.currentPlayer,
          winner: summary.winner,
          entryFee: safeFormatEther(summary.entryFee),
          prizePool: safeFormatEther(summary.prizePool),
          players: summary.players,
          numberGenerated: summary.numberGenerated,
          timeLeft: Number(summary.timeLeft),
          isStuck: summary.isStuck
        }
      },
      null,
      `getGameSummary(${gameId})`
    )
  }, [getContracts, contractsReady])

  // Batch getter for multiple games
  const getGamesBatch = useCallback(async (gameIds: number[]): Promise<GameData[]> => {
    if (!gameIds.length) return []

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const games = await contracts.gameContract.getGamesBatch(gameIds)
        
        return games.map((game: any) => ({
          gameId: Number(game.gameId),
          mode: Number(game.mode) as GameMode,
          currentNumber: Number(game.currentNumber),
          currentPlayer: game.currentPlayer,
          status: Number(game.status) as GameStatus,
          entryFee: safeFormatEther(game.entryFee),
          prizePool: safeFormatEther(game.prizePool),
          winner: game.winner,
          numberGenerated: game.numberGenerated
        }))
      },
      [],
      `getGamesBatch([${gameIds.join(',')}])`
    )
  }, [getContracts, contractsReady])

  const getPlayerStats = useCallback(async (playerAddress: string): Promise<PlayerStats | null> => {
    if (!playerAddress) return null
    
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const stats = await contracts.gameContract.getStats(playerAddress)
        
        return {
          balance: safeFormatEther(stats[0]),
          wins: Number(stats[1]),
          played: Number(stats[2]),
          winRate: Number(stats[3]),
          stakedAmount: safeFormatEther(stats[4])
        }
      },
      null,
      `getPlayerStats(${playerAddress})`
    )
  }, [getContracts, contractsReady])

  const getPlayerBalance = useCallback(async (playerAddress: string): Promise<string> => {
    if (!playerAddress) return "0"
    
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const balance = await contracts.gameContract.balances(playerAddress)
        return safeFormatEther(balance)
      },
      "0",
      `getPlayerBalance(${playerAddress})`
    )
  }, [getContracts, contractsReady])

  const getStakingInfo = useCallback(async (playerAddress: string): Promise<StakingInfo | null> => {
    if (!playerAddress) return null
    
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const info = await contracts.gameContract.staking(playerAddress)
        
        return {
          amount: safeFormatEther(info.amount),
          lastReward: Number(info.lastReward),
          rewards: safeFormatEther(info.rewards)
        }
      },
      null,
      `getStakingInfo(${playerAddress})`
    )
  }, [getContracts, contractsReady])

  const getGameCounter = useCallback(async (): Promise<number> => {
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const counter = await contracts.gameContract.gameCounter()
        const counterNum = Number(counter)
        console.log(`🔢 Game counter: ${counterNum}`)
        return counterNum
      },
      1, // Your contract starts from 1
      'getGameCounter()'
    )
  }, [getContracts, contractsReady])

  const isGameBettable = useCallback(async (gameId: number): Promise<boolean> => {
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        return await contracts.gameContract.isGameBettable(gameId)
      },
      false,
      `isGameBettable(${gameId})`
    )
  }, [getContracts, contractsReady])

  const getGameForSpectators = useCallback(async (gameId: number): Promise<SpectatorGameData | null> => {
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

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
      },
      null,
      `getGameForSpectators(${gameId})`
    )
  }, [getContracts, contractsReady])

  const getPlatformStats = useCallback(async () => {
    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

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
          totalStaked: safeFormatEther(totalStaked),
          timeLimit: Number(timeLimit),
          stakingAPY: Number(stakingAPY)
        }
      },
      null,
      'getPlatformStats()'
    )
  }, [getContracts, contractsReady])

  // Debug function to test contract interactions
  const debugUserGames = useCallback(async (userAddress: string): Promise<any> => {
    if (!userAddress) return { error: 'No address provided' }

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        console.log(`🚀 Starting debug for user: ${userAddress}`)

        // Step 1: Get basic contract info
        const gameCounter = await contracts.gameContract.gameCounter()
        const totalGames = Number(gameCounter)
        
        console.log(`📊 Contract has ${totalGames - 1} games (gameCounter: ${totalGames})`)

        // Step 2: Test getUserGames method directly
        let getUserGamesResult = null
        let getUserGamesError = null
        
        try {
          console.log(`🔍 Testing getUserGames(${userAddress}, 0, 20)...`)
          getUserGamesResult = await contracts.gameContract.getUserGames(userAddress, 0, 20)
          console.log(`✅ getUserGames succeeded:`, getUserGamesResult)
        } catch (error: any) {
          console.error(`❌ getUserGames failed:`, error)
          getUserGamesError = error.message
        }

        // Step 3: Manual check of recent games
        const manualResults: any[] = []
        const recentGamesToCheck = Math.min(10, totalGames - 1)
        
        console.log(`🔍 Manually checking last ${recentGamesToCheck} games...`)
        
        for (let gameId = Math.max(1, totalGames - recentGamesToCheck); gameId < totalGames; gameId++) {
          try {
            // Check isInGame mapping
            const isInGameResult = await contracts.gameContract.isInGame(gameId, userAddress)
            
            // Get players list
            const players = await contracts.gameContract.getPlayers(gameId)
            
            // Get game data
            const gameData = await contracts.gameContract.getGame(gameId)
            
            const result = {
              gameId,
              isInGame: isInGameResult,
              players,
              isInPlayers: players.some((p: string) => p.toLowerCase() === userAddress.toLowerCase()),
              gameStatus: Number(gameData.status),
              gameMode: Number(gameData.mode),
              entryFee: safeFormatEther(gameData.entryFee),
              prizePool: safeFormatEther(gameData.prizePool)
            }
            
            manualResults.push(result)
            
            if (result.isInGame || result.isInPlayers) {
              console.log(`✅ Found user in game ${gameId}:`, result)
            }
            
          } catch (error) {
            console.error(`❌ Error checking game ${gameId}:`, error)
            manualResults.push({
              gameId,
              error: error.message
            })
          }
        }

        const foundGames = manualResults.filter(r => r.isInGame || r.isInPlayers)
        
        return {
          success: true,
          userAddress,
          totalGames: totalGames - 1,
          getUserGamesResult,
          getUserGamesError,
          manualResults,
          foundGamesCount: foundGames.length,
          foundGames,
          summary: {
            contractMethod: getUserGamesError ? 'FAILED' : 'SUCCESS',
            manualSearch: `Found ${foundGames.length} games`,
            gamesChecked: recentGamesToCheck
          }
        }
      },
      { error: 'Contract call failed' },
      `debugUserGames(${userAddress})`
    )
  }, [getContracts, contractsReady])

  return {
    // State
    contractsReady,
    providerReady,
    
    // Original functions
    getGame,
    getPlayers,
    getPlayerView, // Enhanced with new fields
    getPlayerStats,
    getPlayerBalance,
    getStakingInfo,
    getGameCounter,
    isGameBettable,
    getGameForSpectators,
    getPlatformStats,
    
    // NEW functions matching your contract
    getGameSummary,
    getGamesBatch,
    getUserGames, // Enhanced with debugging and fallback
    
    // Debug function
    debugUserGames
  }
}

// Hook for spectator/betting functionality
export function useSpectatorContract() {
  const { getWalletClient } = useContractProvider()
  const [loading, setLoading] = useState(false)

  const executeSpectatorTransaction = async (
    contractCall: () => Promise<any>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    setLoading(true)
    try {
      const walletClient = await getWalletClient()
      
      if (!walletClient) {
        throw new Error('Please connect your wallet')
      }

      toast.success(loadingMessage)
      const tx = await contractCall()
      
      const receipt = await tx.wait()
      toast.success(successMessage)
      return { success: true, txHash: tx.hash, receipt }
    } catch (error: any) {
      console.error('Spectator transaction failed:', error)
      
      let errorMsg = errorMessage
      if (error.reason) {
        errorMsg = error.reason
      } else if (error.message && error.message.includes('user rejected')) {
        errorMsg = 'Transaction cancelled by user'
      }
      
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const placeBet = async (gameId: number, predictedWinner: string, amount: string) => {
    return executeSpectatorTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: SPECTATOR_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSpectatorABI,
          client: walletClient
        })
        
        return await contract.write.placeBet([GAME_CONTRACT_ADDRESS as `0x${string}`, gameId, predictedWinner as `0x${string}`], {
          value: parseEther(amount)
        })
      },
      'Placing bet...',
      'Bet placed successfully!',
      'Failed to place bet'
    )
  }

  const claimBettingWinnings = async (gameId: number) => {
    return executeSpectatorTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: SPECTATOR_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSpectatorABI,
          client: walletClient
        })
        
        return await contract.write.claimBettingWinnings([GAME_CONTRACT_ADDRESS as `0x${string}`, gameId])
      },
      'Claiming winnings...',
      'Winnings claimed successfully!',
      'Failed to claim winnings'
    )
  }

  const withdrawSpectatorBalance = async () => {
    return executeSpectatorTransaction(
      async () => {
        const walletClient = await getWalletClient()
        const contract = viemGetContract({
          address: SPECTATOR_CONTRACT_ADDRESS as `0x${string}`,
          abi: ZeroSumSpectatorABI,
          client: walletClient
        })
        
        return await contract.write.withdrawSpectatorBalance()
      },
      'Withdrawing balance...',
      'Balance withdrawn successfully!',
      'Failed to withdraw balance'
    )
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
  const { providerReady, getProvider } = useContractProvider()

  const getSpectatorContract = useCallback(() => {
    if (!providerReady) return null
    const provider = getProvider()
    if (!provider) return null
    return new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
  }, [providerReady, getProvider])

  const safeSpectatorCall = async <T>(
    contractCall: () => Promise<T>,
    defaultValue: T,
    errorContext: string
  ): Promise<T> => {
    try {
      if (!providerReady) {
        console.log(`⚠️ ${errorContext}: Provider not ready`)
        return defaultValue
      }
      return await contractCall()
    } catch (error) {
      console.error(`❌ ${errorContext}:`, error)
      return defaultValue
    }
  }

  const getBettingInfo = async (gameId: number): Promise<BettingInfo | null> => {
    return safeSpectatorCall(
      async () => {
        const contract = getSpectatorContract()
        if (!contract) throw new Error('Contract not available')

        const info = await contract.getGameBettingInfo(GAME_CONTRACT_ADDRESS, gameId)
        
        return {
          totalBetAmount: safeFormatEther(info.totalBetAmount),
          numberOfBets: Number(info.numberOfBets),
          bettingAllowed: info.bettingAllowed
        }
      },
      null,
      `getBettingInfo(${gameId})`
    )
  }

  const getBettingOdds = async (gameId: number, players: string[]): Promise<BettingOdds | null> => {
    return safeSpectatorCall(
      async () => {
        const contract = getSpectatorContract()
        if (!contract) throw new Error('Contract not available')

        const odds = await contract.getBettingOdds(GAME_CONTRACT_ADDRESS, gameId, players)
        
        return {
          betAmounts: odds.betAmounts.map((amount: any) => safeFormatEther(amount)),
          oddPercentages: odds.oddPercentages.map((percentage: any) => Number(percentage))
        }
      },
      null,
      `getBettingOdds(${gameId})`
    )
  }

  const getSpectatorBalance = async (address: string): Promise<string> => {
    if (!address) return "0"
    
    return safeSpectatorCall(
      async () => {
        const contract = getSpectatorContract()
        if (!contract) throw new Error('Contract not available')

        const balance = await contract.spectatorBalances(address)
        return safeFormatEther(balance)
      },
      "0",
      `getSpectatorBalance(${address})`
    )
  }

  const isBettingAllowed = async (gameId: number): Promise<boolean> => {
    return safeSpectatorCall(
      async () => {
        const contract = getSpectatorContract()
        if (!contract) throw new Error('Contract not available')

        return await contract.isBettingAllowed(GAME_CONTRACT_ADDRESS, gameId)
      },
      false,
      `isBettingAllowed(${gameId})`
    )
  }

  return {
    getBettingInfo,
    getBettingOdds,
    getSpectatorBalance,
    isBettingAllowed
  }
}