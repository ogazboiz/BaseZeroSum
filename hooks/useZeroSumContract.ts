// hooks/useZeroSumContracts.ts - COMPLETE VERSION
import { useState, useEffect, useCallback, useRef } from 'react'
import { useConfig, useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getEthersProvider, getEthersSigner } from '@/config/adapter'
import { toast } from 'react-hot-toast'
import { ZeroSumSimplifiedABI } from '../config/abis/ZeroSumSimplifiedABI'
import { ZeroSumSpectatorABI } from '../config/abis/ZeroSumSpectatorABI'

// Contract addresses - Updated to use correct environment variable names
const GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEROSUM_SIMPLIFIED_ADDRESS || "0x11bb298bbde9ffa6747ea104c2c39b3e59a399b4"
const SPECTATOR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZEROSUM_SPECTATOR_ADDRESS || "0x214124ae23b415b3aea3bb9e260a56dc022baf04"

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

// Provider hook with connection state management
export function useContractProvider() {
  const config = useConfig()
  const { isConnected, address } = useAccount()
  const [providerReady, setProviderReady] = useState(false)
  const providerRef = useRef<any>(null)
  
  useEffect(() => {
    console.log('🔗 Provider connection check:', { isConnected, address })
    
    const initProvider = async () => {
      try {
        const provider = getEthersProvider(config)
        if (provider) {
          providerRef.current = provider
          setProviderReady(true)
          console.log('✅ Provider ready')
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
    
    const timeout = setTimeout(initProvider, 1000)
    return () => clearTimeout(timeout)
  }, [config, isConnected])
  
  const getProvider = useCallback(() => {
    return providerRef.current
  }, [])
  
  const getSigner = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    return await getEthersSigner(config)
  }, [config, isConnected, address])
  
  return {
    providerReady,
    isConnected,
    address,
    getProvider,
    getSigner
  }
}

// Main hook for contract interactions (write functions)
export function useZeroSumContract() {
  const { getSigner } = useContractProvider()
  const [loading, setLoading] = useState(false)

  // Generic transaction handler with better error handling
  const executeTransaction = async (
    contractCall: () => Promise<any>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    setLoading(true)
    try {
      const signer = await getSigner()
      
      if (!signer) {
        throw new Error('Please connect your wallet')
      }

      toast.success(loadingMessage)
      const tx = await contractCall()
      
      console.log(`Transaction sent: ${tx.hash}`)
      
      const receipt = await tx.wait()
      console.log(`Transaction confirmed: ${receipt.transactionHash}`)
      
      // Extract relevant event data if needed
      let gameId = null
      for (const log of receipt.logs) {
        try {
          const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
          const parsed = contract.interface.parseLog(log)
          if (parsed?.name === 'GameCreated') {
            gameId = parsed.args[0].toString()
            break
          }
        } catch (e) {
          // Skip logs that don't match our interface
        }
      }
      
      toast.success(successMessage)
      return { success: true, txHash: tx.hash, receipt, gameId }
    } catch (error: any) {
      console.error('Transaction failed:', error)
      
      let errorMsg = errorMessage
      
      if (error.reason) {
        errorMsg = error.reason
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
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
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.createQuickDraw({
          value: ethers.parseEther(entryFee)
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
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.createStrategic({
          value: ethers.parseEther(entryFee)
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
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.joinGame(gameId, {
          value: ethers.parseEther(entryFee)
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
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        console.log(`Making move: gameId=${gameId}, subtraction=${subtraction}`)
        return await contract.makeMove(gameId, subtraction)
      },
      'Submitting move...',
      'Move submitted successfully!',
      'Failed to submit move'
    )
  }

  const handleTimeout = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.handleTimeout(gameId)
      },
      'Processing timeout...',
      'Timeout handled successfully!',
      'Failed to handle timeout'
    )
  }

  const cancelWaitingGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.cancelWaitingGame(gameId)
      },
      'Cancelling game...',
      'Game cancelled successfully!',
      'Failed to cancel game'
    )
  }

  const forceFinishInactiveGame = async (gameId: number) => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.forceFinishInactiveGame(gameId)
      },
      'Force finishing stuck game...',
      'Game finished successfully!',
      'Failed to force finish game'
    )
  }

  const withdraw = async () => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.withdraw()
      },
      'Withdrawing balance...',
      'Balance withdrawn successfully!',
      'Failed to withdraw'
    )
  }

  const stake = async (amount: string) => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.stake({
          value: ethers.parseEther(amount)
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
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.unstake(ethers.parseEther(amount))
      },
      'Unstaking ETH...',
      'ETH unstaked successfully!',
      'Failed to unstake'
    )
  }

  const claimRewards = async () => {
    return executeTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, signer)
        
        return await contract.claimRewards()
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
          
          const gameContract = new ethers.Contract(GAME_CONTRACT_ADDRESS, ZeroSumSimplifiedABI, provider)
          const spectatorContract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, provider)
          
          // Mark contracts as ready immediately - they're created successfully
          contractsRef.current = { gameContract, spectatorContract }
          setContractsReady(true)
          console.log('✅ Contracts initialized and ready')
          
          // Test connection in background (non-blocking)
          const testContractConnection = async () => {
            try {
              console.log('🧪 Testing contract connection in background...')
              const gameCounter = await gameContract.getGameCounter()
              console.log('✅ Contract connection test successful, game counter:', gameCounter)
            } catch (error) {
              console.warn('⚠️ Contract connection test failed (non-blocking):', error)
              // Don't set contractsReady to false here - let them work anyway
            }
          }
          
          // Test in background without blocking the UI
          testContractConnection().catch(() => {})
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

  // Enhanced error handling for read functions
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
              entryFee: ethers.formatEther(game.entryFee || 0),
              prizePool: ethers.formatEther(game.prizePool || 0),
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
              entryFee: ethers.formatEther(gameData.entryFee || 0),
              prizePool: ethers.formatEther(gameData.prizePool || 0),
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
        const game = await contracts.gameContract.getGame(gameId)
        
        if (!game || Number(game.gameId) === 0 || Number(game.gameId) !== gameId) {
          console.error(`❌ Game #${gameId} returned invalid data`)
          throw new Error(`Game #${gameId} not found`)
        }
        
        const gameData: GameData = {
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

    return safeContractCall(
      async () => {
        const contracts = getContracts()
        if (!contracts) throw new Error('Contracts not ready')

        const players = await contracts.gameContract.getPlayers(gameId)
        console.log(`👥 Players for game ${gameId}:`, players)
        return players || []
      },
      [],
      `getPlayers(${gameId})`
    )
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
          entryFee: ethers.formatEther(summary.entryFee),
          prizePool: ethers.formatEther(summary.prizePool),
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
          entryFee: ethers.formatEther(game.entryFee),
          prizePool: ethers.formatEther(game.prizePool),
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
          balance: ethers.formatEther(stats[0]),
          wins: Number(stats[1]),
          played: Number(stats[2]),
          winRate: Number(stats[3]),
          stakedAmount: ethers.formatEther(stats[4])
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
        return ethers.formatEther(balance)
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
          amount: ethers.formatEther(info.amount),
          lastReward: Number(info.lastReward),
          rewards: ethers.formatEther(info.rewards)
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
          totalStaked: ethers.formatEther(totalStaked),
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
              entryFee: ethers.formatEther(gameData.entryFee),
              prizePool: ethers.formatEther(gameData.prizePool)
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
  const { getSigner } = useContractProvider()
  const [loading, setLoading] = useState(false)

  const executeSpectatorTransaction = async (
    contractCall: () => Promise<any>,
    loadingMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    setLoading(true)
    try {
      const signer = await getSigner()
      
      if (!signer) {
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
        const signer = await getSigner()
        const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
        
        return await contract.placeBet(GAME_CONTRACT_ADDRESS, gameId, predictedWinner, {
          value: ethers.parseEther(amount)
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
        const signer = await getSigner()
        const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
        
        return await contract.claimBettingWinnings(GAME_CONTRACT_ADDRESS, gameId)
      },
      'Claiming winnings...',
      'Winnings claimed successfully!',
      'Failed to claim winnings'
    )
  }

  const withdrawSpectatorBalance = async () => {
    return executeSpectatorTransaction(
      async () => {
        const signer = await getSigner()
        const contract = new ethers.Contract(SPECTATOR_CONTRACT_ADDRESS, ZeroSumSpectatorABI, signer)
        
        return await contract.withdrawSpectatorBalance()
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
          totalBetAmount: ethers.formatEther(info.totalBetAmount),
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
          betAmounts: odds.betAmounts.map((amount: any) => ethers.formatEther(amount)),
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
        return ethers.formatEther(balance)
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