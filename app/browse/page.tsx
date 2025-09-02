"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gamepad2,
  Coins,
  Swords,
  Target,
  Brain,
  Eye,
  Zap,
  Loader2,
  RefreshCw,
  Users,
  Clock,
  Trophy,
  Search,
  Filter,
  Wallet,
  ExternalLink,
  Copy,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { toast } from "react-hot-toast"
import {
  useZeroSumData,
  useZeroSumContract,
  GameData,
  GameStatus,
  GameMode
} from "@/hooks/useZeroSumContract"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
// import { useHardcoreMysteryData, useHardcoreMysteryContract, HardcoreMysteryGame, GameMode as HardcoreGameMode, GameStatus as HardcoreGameStatus } from "@/hooks/useHardcoreMysteryContracts"
import { useSpectatorData } from "@/hooks/useSpectatorContract"

// Enhanced battle data for browse page
interface BrowsableGame extends GameData {
  players: string[]
  canJoin: boolean
  canWatch: boolean
  timeLeft?: number
  isCreator?: boolean
  contractType: 'zerosum'
  userHasBet: boolean
}

// interface HardcoreBrowsableGame extends HardcoreMysteryGame {
//   players: string[]
//   canJoin: boolean
//   canWatch: boolean
//   timeLeft?: number
//   isCreator?: boolean
//   contractType: 'hardcore'
//   userHasBet: boolean
// }

type CombinedBrowsableGame = BrowsableGame

interface BrowseFilters {
  id: string
  name: string
  count: number
  icon: any
}

interface BrowseStats {
  totalGames: number
  quickDrawGames: number
  strategicGames: number
  // hardcoreMysteryGames: number
  totalPrizePool: string
  waitingGames: number
  activeGames: number
}

export default function UpdatedBrowseGamesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  // Blockchain hooks
  const {
    getGameCounter,
    getGame,
    getPlayers,
    isGameBettable,
    getGamesBatch,
    contractsReady,
    providerReady
  } = useZeroSumData()
  
  const { joinGame, loading: contractLoading } = useZeroSumContract()

  // Hardcore Mystery contract hooks - DISABLED (contract not deployed)
  // const {
  //   getGameCounter: getHardcoreGameCounter,
  //   getGame: getHardcoreGame,
  //   getPlayers: getHardcorePlayers,
  //   isGameBettable: isHardcoreGameBettable
  // } = useHardcoreMysteryData()
  
  // const { joinGame: joinHardcoreGame, loading: hardcoreContractLoading } = useHardcoreMysteryContract()

  // Spectator contract hooks
  const {
    getBettingInfo,
    isBettingAllowed,
    getTotalBetsOnPlayer,
    hasUserBetOnGame,
    getUserBetInfo
  } = useSpectatorData()

  // State management
  const [browsableGames, setBrowsableGames] = useState<CombinedBrowsableGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [joiningBattle, setJoiningBattle] = useState<number | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<string>("")
  const [browseStats, setBrowseStats] = useState<BrowseStats>({
    totalGames: 0,
    quickDrawGames: 0,
    strategicGames: 0,
    // hardcoreMysteryGames: 0,
    totalPrizePool: "0",
    waitingGames: 0,
    activeGames: 0
  })
  const [hardcoreContractAvailable, setHardcoreContractAvailable] = useState(false) // DISABLED - contract not deployed
  const hardcoreContractAvailableRef = useRef(false) // Ref to avoid circular dependencies
  const [zeroSumContractRetries, setZeroSumContractRetries] = useState(0) // Track ZeroSum contract retries
  const [previousAddress, setPreviousAddress] = useState<string | undefined>(undefined) // Track address changes
  const [userBettingAttempts, setUserBettingAttempts] = useState<Set<string>>(new Set()) // Track betting attempts

  // Function to check if user can bet on a game
  const canUserBetOnGame = useCallback(async (game: any, contractType: 'zerosum' | 'hardcore'): Promise<boolean> => {
    if (!isConnected || !address) return false
    
    try {
      // Check if betting is allowed for this game
      const gameContractType = contractType === 'zerosum' ? 'simplified' : 'hardcore'
      const bettingInfo = await getBettingInfo(gameContractType as any, game.gameId)
      
      if (!bettingInfo || !bettingInfo.bettingAllowed) {
        return false
      }
      
      // Check if user is already in the game
      const isUserInGame = game.players.some((p: string) => p.toLowerCase() === address.toLowerCase())
      if (isUserInGame) return false
      
      // Check if user has already attempted to bet
      const gameKey = `${contractType}-${game.gameId}-${address.toLowerCase()}`
      if (userBettingAttempts.has(gameKey)) return false
      
      return true
    } catch (error) {
      console.warn(`Could not check if user can bet on ${contractType} game:`, error)
      return false
    }
  }, [isConnected, address, getBettingInfo, userBettingAttempts])

  // Function to check if user has already bet on a game - NOW USING REAL CONTRACT!
  const checkUserBetStatus = useCallback(async (game: any, players: string[], contractType: 'zerosum' | 'hardcore'): Promise<boolean> => {
    if (!isConnected || !address) return false
    
    try {
      // Method 1: Check if user is in the game (they've bet to join)
      const isUserInGame = players.some(p => p.toLowerCase() === address.toLowerCase())
      if (isUserInGame) return true
      
      // Method 2: Use the REAL CONTRACT FUNCTION! 🎉
      try {
        const gameContractType = contractType === 'zerosum' ? 'simplified' : 'hardcore'
        
        // Call the real contract function using the spectator data hook!
        const hasBet = await hasUserBetOnGame(gameContractType as any, game.gameId, address)
        return hasBet
      } catch (bettingError) {
        console.warn(`Could not check contract betting status for ${contractType} game:`, bettingError)
        // Fallback: if we can't check contract, assume user can bet if not in game
        return false
      }
    } catch (error) {
      console.warn(`Could not check user bet status for ${contractType} game:`, error)
      return false
    }
  }, [isConnected, address, hasUserBetOnGame])

  // Function to get detailed bet information for display
  const getBetDetails = useCallback(async (game: any, contractType: 'zerosum' | 'hardcore') => {
    if (!isConnected || !address) return null
    
    try {
      const gameContractType = contractType === 'zerosum' ? 'simplified' : 'hardcore'
      const betInfo = await getUserBetInfo(gameContractType as any, game.gameId, address)
      return betInfo
    } catch (error) {
      console.warn(`Could not get bet details for ${contractType} game:`, error)
      return null
    }
  }, [isConnected, address, getUserBetInfo])

  // Function to track betting attempts
  const trackBettingAttempt = useCallback((contractType: 'zerosum' | 'hardcore', gameId: number) => {
    if (!address) return
    
    const gameKey = `${contractType}-${gameId}-${address.toLowerCase()}`
    setUserBettingAttempts(prev => new Set([...prev, gameKey]))
  }, [address])

  // Function to clear betting attempts (for testing)
  const clearBettingAttempts = useCallback(() => {
    setUserBettingAttempts(new Set())
    toast.success("Betting attempts cleared")
  }, [])

  // Fetch browsable games from blockchain - DUAL CONTRACT VERSION
  const fetchBrowsableGames = useCallback(async () => {
    // console.log('🎮 Fetching browsable games from both contracts...')
    
    // Check if contracts are ready before proceeding
    if (!contractsReady || !providerReady) {
      // console.log('⏳ Contracts not ready yet, skipping fetch...')
      setError('Contracts not ready yet. Please wait for blockchain connection.')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // Fetch from both contracts
      let zeroSumGames: Array<{
        game: GameData
        players: string[]
        bettable: boolean
        gameId: number
        contractType: 'zerosum'
        userHasBet: boolean
      }> = []
      
      // let hardcoreGames: Array<{
      //   game: HardcoreMysteryGame
      //   players: string[]
      //   bettable: boolean
      //   gameId: number
      //   contractType: 'hardcore'
      //   userHasBet: boolean
      // }> = []

      // Fetch ZeroSum games with fallback to individual calls
      try {
        const gameCounter = await getGameCounter()
        // console.log(`📊 ZeroSum games on contract: ${gameCounter}`)

        if (gameCounter > 0) {
          const gameIds = Array.from({ length: gameCounter }, (_, i) => i + 1)
          // console.log(`🚀 Attempting batch fetch for ${gameIds.length} ZeroSum games...`)
          
          try {
            // Try batch fetch first
            const games = await getGamesBatch(gameIds)
            if (games && games.length > 0 && games[0]) {
              // console.log('✅ Batch fetch successful, processing games...')
              // console.log('🔍 Raw games from batch:', games.map(g => ({ id: g?.gameId, status: g?.status })))
              
              const browsableGamePromises = games
                .filter(game => 
                  game && 
                  game.gameId > 0 && // Ensure game ID is valid (greater than 0)
                  (
                    game.status === GameStatus.WAITING || 
                    game.status === GameStatus.ACTIVE
                  )
                )
                .map(async (game) => {
                  // console.log(`🎮 Processing ZeroSum game ID: ${game.gameId}`)
                  try {
                    const [players, bettable] = await Promise.all([
                      getPlayers(game.gameId),
                      isGameBettable(game.gameId)
                    ])
                    
                    // Check if current user has already bet on this game
                    let userHasBet = false
                    if (isConnected && address) {
                      try {
                        // Use the new function to check user bet status
                        userHasBet = await checkUserBetStatus(game, players, 'zerosum')
                      } catch (error) {
                        console.warn(`Could not check user bet status for game ${game.gameId}:`, error)
                        userHasBet = false
                      }
                    }
                    
                    return { 
                      game, 
                      players, 
                      bettable, 
                      gameId: game.gameId, 
                      contractType: 'zerosum' as const,
                      userHasBet
                    }
                  } catch (error) {
                    console.warn(`Failed to get ZeroSum game ${game.gameId}:`, error)
                    return null
                  }
                })

              const gameResults = await Promise.all(browsableGamePromises)
              zeroSumGames = gameResults.filter(result => result !== null) as typeof zeroSumGames
              // console.log(`✅ Found ${zeroSumGames.length} ZeroSum games via batch fetch`)
            } else {
              // console.log('⚠️ Batch fetch returned empty data, trying individual calls...')
              // Fallback to individual game calls
              const individualGamePromises = gameIds
                .filter(gameId => gameId > 0) // Ensure game ID is valid (greater than 0)
                .map(async (gameId) => {
                  try {
                    const [game, players, bettable] = await Promise.all([
                      getGame(gameId),
                      getPlayers(gameId),
                      isGameBettable(gameId)
                    ])
                    
                    if (game && (game.status === GameStatus.WAITING || game.status === GameStatus.ACTIVE)) {
                      // Check if current user has already bet on this game
                      let userHasBet = false
                      if (isConnected && address) {
                        try {
                          // Use the new function to check user bet status
                          userHasBet = await checkUserBetStatus(game, players, 'zerosum')
                        } catch (error) {
                          console.warn(`Could not check user bet status for game ${gameId}:`, error)
                          userHasBet = false
                        }
                      }
                      
                      return { 
                        game, 
                        players, 
                        bettable, 
                        gameId, 
                        contractType: 'zerosum' as const,
                        userHasBet
                      }
                    }
                    return null
                  } catch (error) {
                    console.warn(`Failed to get individual ZeroSum game ${gameId}:`, error)
                    return null
                  }
                })

              const individualResults = await Promise.all(individualGamePromises)
              zeroSumGames = individualResults.filter(result => result !== null) as typeof zeroSumGames
              // console.log(`✅ Found ${zeroSumGames.length} ZeroSum games via individual calls`)
            }
          } catch (batchError) {
            // console.log('⚠️ Batch fetch failed, falling back to individual calls:', batchError)
            
            // Fallback to individual game calls
            const individualGamePromises = gameIds
              .filter(gameId => gameId > 0) // Ensure game ID is valid (greater than 0)
              .map(async (gameId) => {
                try {
                  const [game, players, bettable] = await Promise.all([
                    getGame(gameId),
                    getPlayers(gameId),
                    isGameBettable(gameId)
                  ])
                  
                                      if (game && (game.status === GameStatus.WAITING || game.status === GameStatus.ACTIVE)) {
                      // Check if current user has already bet on this game
                      let userHasBet = false
                      if (isConnected && address) {
                        try {
                          // Use the new function to check user bet status
                          userHasBet = await checkUserBetStatus(game, players, 'zerosum')
                        } catch (error) {
                          console.warn(`Could not check user bet status for game ${gameId}:`, error)
                          userHasBet = false
                        }
                      }
                    
                    return { 
                      game, 
                      players, 
                      bettable, 
                      gameId, 
                      contractType: 'zerosum' as const,
                      userHasBet
                    }
                  }
                  return null
                } catch (error) {
                  console.warn(`Failed to get individual ZeroSum game ${gameId}:`, error)
                  return null
                }
              })

            const individualResults = await Promise.all(individualGamePromises)
            zeroSumGames = individualResults.filter(result => result !== null) as typeof zeroSumGames
            // console.log(`✅ Found ${zeroSumGames.length} ZeroSum games via individual fallback`)
          }
        }
      } catch (error) {
        console.warn('ZeroSum contract not available:', error)
      }

            // Fetch Hardcore Mystery games - DISABLED (contract not deployed)
      // if (hardcoreContractAvailableRef.current) {
      //   try {
      //     const hardcoreGameCounter = await getHardcoreGameCounter()
      //     // console.log(`📊 Hardcore Mystery games on contract: ${hardcoreGameCounter}`)

      //     if (hardcoreGameCounter > 0) {
      //       const hardcoreGamePromises = []
      //       for (let i = 1; i <= hardcoreGameCounter; i++) {
      //         hardcoreGamePromises.push(
      //           Promise.all([
      //             getHardcoreGame(i),
      //             getHardcorePlayers(i),
      //             isHardcoreGameBettable(i)
      //           ]).then(async ([game, players, bettable]) => {
      //                                 if (game && (game.status === HardcoreGameStatus.WAITING || game.status === HardcoreGameStatus.ACTIVE)) {
      //             // Check if current user has already bet on this game
      //             let userHasBet = false
      //             if (isConnected && address) {
      //               try {
      //                 // Use the new function to check user bet status
      //                 userHasBet = await checkUserBetStatus(game, players, 'hardcore')
      //               } catch (error) {
      //                 console.warn(`Could not check user bet status for hardcore game ${i}:`, error)
      //                 userHasBet = false
      //               }
      //             }

      //             return {
      //               game, 
      //               players, 
      //               bettable, 
      //               gameId: i, 
      //               contractType: 'hardcore' as const,
      //               userHasBet
      //             }
      //           }
      //         return null
      //       }).catch(error => {
      //         console.warn(`Failed to fetch Hardcore game ${i}:`, error)
      //         return null
      //       })
      //     )
      //   }

      //   const hardcoreResults = await Promise.all(hardcoreGamePromises)
      //   hardcoreGames = hardcoreResults.filter(result => result !== null) as typeof hardcoreGames
      //   // console.log(`✅ Found ${zeroSumGames.length} Hardcore Mystery games`)
      // }
      // } catch (error) {
      //   console.warn('Hardcore Mystery contract not available:', error)
      // }
      // }

      // Combine all games - only ZeroSum games (hardcore disabled)
      const allGames = [...zeroSumGames]
      // console.log(`🎯 Total games found: ${allGames.length} (${zeroSumGames.length} ZeroSum)`)

      // Transform to browsable format (without creator detection - will be done dynamically)
      const browsable: CombinedBrowsableGame[] = allGames.map(({ game, players, bettable, contractType, userHasBet }) => {
        if (contractType === 'zerosum') {
          const zeroSumGame = game as GameData
          const canWatch = zeroSumGame.status === GameStatus.ACTIVE || bettable

          return {
            ...zeroSumGame,
            players,
            canJoin: true, // Will be calculated dynamically
            canWatch,
            isCreator: false, // Will be calculated dynamically
            contractType: 'zerosum',
            userHasBet
          }
        } else {
          // Hardcore games disabled - this should not happen
          throw new Error('Hardcore games are disabled')
        }
      })

      // ✅ FINAL SAFETY CHECK: Filter out any games with invalid IDs
      const validBrowsable = browsable.filter(game => {
        if (game.contractType === 'zerosum') {
          return game.gameId > 0
        } else {
          return game.gameId > 0
        }
      })
      
      // console.log(`🔒 Final validation: ${browsable.length} → ${validBrowsable.length} valid games`)

      // Calculate stats
      const stats: BrowseStats = {
        totalGames: validBrowsable.length,
        quickDrawGames: validBrowsable.filter(g => g.contractType === 'zerosum' && g.mode === GameMode.QUICK_DRAW).length,
        strategicGames: validBrowsable.filter(g => g.contractType === 'zerosum' && g.mode === GameMode.STRATEGIC).length,
        // hardcoreMysteryGames: validBrowsable.filter(g => g.contractType === 'hardcore').length,
        totalPrizePool: validBrowsable.reduce((sum, g) => sum + (parseFloat(g.entryFee) * 2), 0).toFixed(4),
        waitingGames: validBrowsable.filter(g => 
          g.contractType === 'zerosum' && g.status === GameStatus.WAITING
        ).length,
        activeGames: validBrowsable.filter(g => 
          g.contractType === 'zerosum' && g.status === GameStatus.ACTIVE
        ).length
      }

      setBrowsableGames(validBrowsable)
      setBrowseStats(stats)
      setLastFetchTime(new Date().toLocaleTimeString())
      // console.log('✅ Browse data updated:', { games: validBrowsable.length, stats })

    } catch (error) {
      console.error('❌ Error fetching browsable games:', error)
      setError(error instanceof Error ? error.message : 'Failed to load games')
    } finally {
      setIsLoading(false)
    }
  }, [getGameCounter, getGame, getPlayers, isGameBettable, isConnected, address, checkUserBetStatus])

  // Check Hardcore Mystery contract availability - DISABLED (contract not deployed)
  // useEffect(() => {
  //   const checkHardcoreContract = async () => {
  //     try {
  //       await getHardcoreGameCounter()
  //       setHardcoreContractAvailable(true)
  //       hardcoreContractAvailableRef.current = true
  //       // console.log('✅ Hardcore Mystery contract available')
  //     } catch (error) {
  //       console.warn('Hardcore Mystery contract not available:', error)
  //       setHardcoreContractAvailable(false)
  //       hardcoreContractAvailableRef.current = false
  //     }
  //   }
    
  //   if (providerReady) {
  //     checkHardcoreContract()
  //   }
  // }, [providerReady, getHardcoreGameCounter])

  // Initial data fetch - depends on both providerReady and contractsReady
  useEffect(() => {
    if (providerReady && contractsReady) {
      // console.log('🚀 Both provider and contracts ready, fetching games...')
      fetchBrowsableGames()
    }
  }, [providerReady, contractsReady]) // Added contractsReady dependency

  // Refetch games when address changes to update userHasBet status
  useEffect(() => {
    if (providerReady && contractsReady && isConnected) {
      // console.log('🔄 Address changed, refetching games to update bet status...')
      fetchBrowsableGames()
    }
  }, [address, providerReady, contractsReady, isConnected])

  // Track address changes
  useEffect(() => {
    if (address && address !== previousAddress) {
      setPreviousAddress(address)
      // Clear betting attempts when address changes
      setUserBettingAttempts(new Set())
    }
  }, [address, previousAddress])

  // Function to calculate dynamic properties for a game based on current wallet
  const getGameDynamicProps = useCallback((game: CombinedBrowsableGame) => {
    if (game.contractType === 'zerosum') {
      const canJoin = game.status === GameStatus.WAITING && 
                     game.players.length < 2 && 
                     (!isConnected || !game.players.some(p => p.toLowerCase() === address?.toLowerCase())) &&
                     !game.userHasBet // User cannot join if they have already bet
      const isCreator = isConnected && address && game.players.length > 0 && 
                       game.players[0].toLowerCase() === address.toLowerCase()
      
      return { canJoin, isCreator }
    } else {
      // Hardcore games disabled - this should not happen
      return { canJoin: false, isCreator: false }
    }
  }, [isConnected, address])

  // Create filter options
  const filters: BrowseFilters[] = [
    { id: "all", name: "All Games", count: browseStats.totalGames, icon: Gamepad2 },
    { id: "waiting", name: "Waiting", count: browseStats.waitingGames, icon: Clock },
    { id: "active", name: "Active", count: browseStats.activeGames, icon: Swords },
    { id: "quick-draw", name: "Quick Draw", count: browseStats.quickDrawGames, icon: Target },
    { id: "strategic", name: "Strategic", count: browseStats.strategicGames, icon: Brain },
    // ...(hardcoreContractAvailable ? [{ id: "hardcore", name: "Hardcore Mystery", count: browseStats.hardcoreMysteryGames, icon: Zap }] : []), // Disabled
    ...(isConnected ? [{ id: "can-join", name: "Can Join", count: browsableGames.filter(g => getGameDynamicProps(g).canJoin).length, icon: Swords }] : [])
  ]

  // Filter games based on search and selected filter
  const filteredGames = browsableGames.filter((game) => {
    const matchesSearch = 
      game.gameId.toString().includes(searchTerm) ||
      (game.contractType === 'zerosum' 
        ? (game.mode === GameMode.QUICK_DRAW ? "quick draw" : "strategic")
        : "hardcore mystery"
      ).includes(searchTerm.toLowerCase())
    
    switch (selectedFilter) {
      case "all": return matchesSearch
      case "waiting": return matchesSearch && (
        game.contractType === 'zerosum' && game.status === GameStatus.WAITING
      )
      case "active": return matchesSearch && (
        game.contractType === 'zerosum' && game.status === GameStatus.ACTIVE
      )
      case "quick-draw": return matchesSearch && game.contractType === 'zerosum' && game.mode === GameMode.QUICK_DRAW
      case "strategic": return matchesSearch && game.contractType === 'zerosum' && game.mode === GameMode.STRATEGIC
      // case "hardcore": return matchesSearch && game.contractType === 'hardcore' // Disabled
      case "can-join": return matchesSearch && getGameDynamicProps(game).canJoin
      default: return matchesSearch
    }
  })

  // Action handlers
  const handleJoinBattle = async (gameId: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to join battles!")
      return
    }

    const game = browsableGames.find(g => g.gameId === gameId)
    if (!game) {
      toast.error("Game not found!")
      return
    }

    if (!game.canJoin) {
      toast.error("Cannot join this game!")
      return
    }

    setJoiningBattle(gameId)
    
    try {
      // Track the betting attempt
      trackBettingAttempt(game.contractType, gameId)
      
      // console.log(`🎮 Joining ${game.contractType} game ${gameId} with entry fee ${game.entryFee} ETH`)
      
      let result
      if (game.contractType === 'zerosum') {
        result = await joinGame(gameId, game.entryFee)
      } else {
        // Hardcore games disabled
        throw new Error('Hardcore games are not available')
      }
      
      if (result.success) {
        toast.success("Successfully joined the battle!")
        // Redirect to appropriate battle page
        setTimeout(() => {
          if (game.contractType === 'zerosum') {
            router.push(`/battle/${gameId}`)
          } else {
            router.push(`/battle/hardcore/${gameId}`)
          }
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error joining battle:', error)
      toast.error("Failed to join battle")
    } finally {
      setJoiningBattle(null)
    }
  }

  const handleWatchBattle = (gameId: number) => {
    const game = browsableGames.find(g => g.gameId === gameId)
    // All games go to normal battle page (hardcore disabled)
    router.push(`/battle/${gameId}`)
  }

  const copyGameLink = (gameId: number) => {
    const game = browsableGames.find(g => g.gameId === gameId)
    // All games use normal battle URL (hardcore disabled)
    const url = `${window.location.origin}/battle/${gameId}`
    navigator.clipboard.writeText(url)
    toast.success("Game link copied!")
  }

  // Utility functions for both contract types
  const getGameModeName = (game: CombinedBrowsableGame) => {
    if (game.contractType === 'zerosum') {
      return game.mode === GameMode.QUICK_DRAW ? "Quick Draw" : "Strategic"
    } else {
      // Hardcore games disabled
      return "Unavailable"
    }
  }

  const getGameModeIcon = (game: CombinedBrowsableGame) => {
    if (game.contractType === 'zerosum') {
      return game.mode === GameMode.QUICK_DRAW ? Target : Brain
    } else {
      // Hardcore games disabled
      return Gamepad2
    }
  }

  const getStatusColor = (game: CombinedBrowsableGame) => {
    if (game.contractType === 'zerosum') {
      switch (game.status) {
        case GameStatus.WAITING: return "bg-amber-500/20 text-amber-400 border-amber-500/30"
        case GameStatus.ACTIVE: return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
      }
    } else {
      // Hardcore games disabled
      return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (game: CombinedBrowsableGame) => {
    if (game.contractType === 'zerosum') {
      switch (game.status) {
        case GameStatus.WAITING: return Clock
        case GameStatus.ACTIVE: return Swords
        default: return Gamepad2
      }
    } else {
      // Hardcore games disabled
      return Gamepad2
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <UnifiedGamingNavigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-full px-6 py-2 mb-6">
            <Swords className="w-5 h-5 text-rose-400" />
            <span className="text-rose-400 font-bold">ACTIVE BATTLES</span>
            <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">CHOOSE YOUR BATTLE</h1>
          <p className="text-xl text-slate-300 font-medium">Join ongoing battles or spectate the warfare</p>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: {lastFetchTime || "Never"}
          </p>
          
          {/* User Bet Summary */}
          {isConnected && browsableGames.length > 0 && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-cyan-400 font-medium">Your Bets</p>
                  <p className="text-cyan-300 font-bold text-lg">
                    {browsableGames.filter(g => g.userHasBet).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-400 font-medium">Can Join</p>
                  <p className="text-emerald-300 font-bold text-lg">
                    {browsableGames.filter(g => getGameDynamicProps(g).canJoin).length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 font-medium">Total Games</p>
                  <p className="text-slate-300 font-bold text-lg">
                    {browsableGames.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-medium">Attempts</p>
                  <p className="text-blue-300 font-bold text-lg">
                    {userBettingAttempts.size}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          {(!contractsReady || !providerReady) && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-pulse text-amber-400" />
                <p className="text-amber-400 font-medium">
                  {!providerReady ? "Connecting to blockchain" : "Initializing smart contracts"}
                </p>
              </div>
            </div>
          )}
          
          {/* Connection Status - Only show when trying to join */}
          {!isConnected && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                <p className="text-blue-400 font-medium">
                  Connect wallet to join battles • Browsing enabled without wallet
                </p>
              </div>
            </div>
          )}
          
          {/* Address Change Notice */}
          {isConnected && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 font-medium text-sm">
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <Button
                  onClick={fetchBrowsableGames}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
          
          {/* Address Change Notice */}
          {isConnected && previousAddress && previousAddress !== address && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-amber-400 font-medium text-sm">
                    Address changed from {previousAddress.slice(0, 6)}...{previousAddress.slice(-4)}
                  </p>
                </div>
                <Button
                  onClick={fetchBrowsableGames}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Update
                </Button>
              </div>
            </div>
          )}
          
          {/* Betting Attempts Notice */}
          {isConnected && userBettingAttempts.size > 0 && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <p className="text-blue-400 font-medium text-sm">
                    You have {userBettingAttempts.size} betting attempt{userBettingAttempts.size !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                <Button
                  onClick={clearBettingAttempts}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by game ID or mode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white rounded-xl"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => {
              const Icon = filter.icon
              return (
                <Button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  variant={selectedFilter === filter.id ? "default" : "outline"}
                  className={`${
                    selectedFilter === filter.id
                      ? "bg-cyan-600 hover:bg-cyan-700 border-cyan-500"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  } rounded-xl`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {filter.name} ({filter.count})
                </Button>
              )
            })}
          </div>

          {/* Refresh */}
          <Button
            onClick={fetchBrowsableGames}
            disabled={isLoading || !contractsReady || !providerReady}
            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : !contractsReady || !providerReady ? (
              <Loader2 className="w-4 h-4 animate-pulse mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
                            {isLoading ? "Refreshing..." : !contractsReady || !providerReady ? "Connecting" : "Refresh"}
          </Button>
          
          {/* Debug Toggle */}
          {isConnected && (
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl"
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Error: {error}</p>
            </div>
            {error.includes('Contracts not ready') && (
              <div className="mt-2 text-sm text-red-300">
                This usually happens when the page is refreshed before blockchain connection is established. 
                Please wait a moment and try refreshing again.
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-xl text-slate-300">Loading battles from blockchain...</p>
            <p className="text-sm text-slate-400 mt-2">
              {address ? `Updating bet status for ${address.slice(0, 6)}...${address.slice(-4)}` : 'Fetching game data from smart contracts...'}
            </p>
          </div>
        )}

        {/* Contract Connecting State */}
        {!isLoading && (!contractsReady || !providerReady) && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-pulse mx-auto mb-4 text-amber-400" />
                            {/* <p className="text-xl text-slate-300">Connecting to blockchain...</p> */}
            <p className="text-sm text-slate-400 mt-2">
              Please wait while we establish connection to smart contracts
            </p>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-amber-400 text-sm">
                {!providerReady ? "Connecting to Web3 provider" : "Initializing smart contracts"}
              </p>
            </div>
          </div>
        )}

        {/* Games Grid */}
        {!isLoading && contractsReady && providerReady && filteredGames.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGames.map((game) => {
              const ModeIcon = getGameModeIcon(game)
              const StatusIcon = getStatusIcon(game)
              const { canJoin, isCreator } = getGameDynamicProps(game)
              
              return (
                <Card key={game.gameId} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${
                          game.contractType === 'zerosum' && game.mode === GameMode.QUICK_DRAW 
                            ? "from-emerald-400 to-teal-600" 
                            : game.contractType === 'zerosum' && game.mode === GameMode.STRATEGIC
                            ? "from-blue-400 to-indigo-600"
                            : "from-slate-400 to-slate-600" // Hardcore disabled
                        } rounded-xl flex items-center justify-center`}>
                          <ModeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black text-white">
                            {getGameModeName(game)}
                          </CardTitle>
                          <p className="text-slate-400 text-sm">
                            {game.contractType === 'zerosum' ? 'ZeroSum' : 'Hardcore'} #{game.gameId}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(game)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {game.contractType === 'zerosum' 
                            ? (game.status === GameStatus.WAITING ? "WAITING" : "ACTIVE")
                            : "UNAVAILABLE"
                          }
                        </Badge>
                        {game.userHasBet && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Coins className="w-3 h-3 mr-1" />
                            BET PLACED
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Game Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-slate-400">Entry Fee</span>
                        </div>
                        <div className="font-bold text-emerald-400">
                          {parseFloat(game.entryFee).toFixed(4)} MNT
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Trophy className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-slate-400">Prize Pool</span>
                        </div>
                        <div className="font-bold text-cyan-400">
                          {(parseFloat(game.entryFee) * 2).toFixed(4)} MNT
                        </div>
                      </div>
                    </div>

                    {/* Players */}
                                          <div className="bg-slate-700/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-violet-400" />
                          <span className="text-sm font-medium text-white">
                            Players ({game.players.length}/2)
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {game.players.map((player, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">
                                {index === 0 ? "Creator" : `Player ${index + 1}`}:
                              </span>
                              <span className="font-mono text-cyan-400">
                                {player.slice(0, 6)}...{player.slice(-4)}
                              </span>
                            </div>
                          ))}
                          
                          {game.players.length < 2 && (
                            <div className="text-xs text-amber-400 text-center py-1">
                              Waiting for opponent...
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Game Rules Preview */}
                    <div className="text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2">
                      {game.contractType === 'zerosum'
                        ? (game.mode === GameMode.QUICK_DRAW
                            ? "⚡ Subtract exactly 1 each turn - reach 0 to WIN!"
                            : "🧠 Subtract 10-30% each turn - force opponent to hit 0!")
                        : "🚧 Game mode not available"
                      }
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {canJoin && !isCreator && (
                        <Button
                          onClick={() => handleJoinBattle(game.gameId)}
                          disabled={!isConnected || joiningBattle === game.gameId || contractLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        >
                          {joiningBattle === game.gameId ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : !isConnected ? (
                            <Wallet className="w-4 h-4 mr-2" />
                          ) : (
                            <Swords className="w-4 h-4 mr-2" />
                          )}
                          {joiningBattle === game.gameId ? "Joining..." : 
                           !isConnected ? "Connect to Join" : "JOIN"}
                        </Button>
                      )}
                      
                      {isCreator && (
                        <Button
                          disabled
                          className="flex-1 bg-blue-600 text-white rounded-lg cursor-not-allowed"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Creator
                        </Button>
                      )}
                      
                      {game.userHasBet && (
                        <Button
                          disabled
                          className="flex-1 bg-amber-600 text-white rounded-lg cursor-not-allowed"
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Already Bet
                        </Button>
                      )}
                      
                      {game.canWatch && (
                        <Button
                          onClick={() => handleWatchBattle(game.gameId)}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                      )}
                      
                      {game.status === GameStatus.WAITING && (
                        <Button
                          onClick={() => copyGameLink(game.gameId)}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Additional Info */}
                    {!isConnected && canJoin && !isCreator && (  
                      <div className="text-xs text-center text-amber-400 bg-amber-500/10 rounded p-2">
                        💡 Connect your wallet to join this battle
                      </div>
                    )}
                    
                    {isCreator && (
                      <div className="text-xs text-center text-blue-400 bg-blue-500/10 rounded p-2">
                        🏆 You created this battle
                      </div>
                    )}
                    
                    {game.userHasBet && (
                      <div className="text-xs text-center text-amber-400 bg-amber-500/10 rounded p-2">
                        🎯 You have already bet on this game
                      </div>
                    )}
                    
                    {/* Show detailed bet information */}
                    {isConnected && address && game.userHasBet && (
                      <div className="text-xs text-center text-blue-400 bg-blue-500/10 rounded p-2">
                        💰 Bet details available (click debug panel for more info)
                      </div>
                    )}
                    
                    {!canJoin && !isCreator && !game.userHasBet && isConnected && (
                      <div className="text-xs text-center text-slate-400 bg-slate-500/10 rounded p-2">
                        ❌ Cannot join this game
                      </div>
                    )}
                    
                    {/* Show betting attempt info */}
                    {isConnected && address && (
                      (() => {
                        const gameKey = `${game.contractType}-${game.gameId}-${address.toLowerCase()}`
                        const hasAttempted = userBettingAttempts.has(gameKey)
                        return hasAttempted ? (
                          <div className="text-xs text-center text-blue-400 bg-blue-500/10 rounded p-2">
                            🔄 Betting attempt recorded
                          </div>
                        ) : null
                      })()
                    )}
                    
                    {/* Show if user can bet on this game */}
                    {isConnected && address && !game.userHasBet && !getGameDynamicProps(game).canJoin && !getGameDynamicProps(game).isCreator && (
                      <div className="text-xs text-center text-green-400 bg-green-500/10 rounded p-2">
                        💰 You can place a bet on this game
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && contractsReady && providerReady && filteredGames.length === 0 && (
          <div className="text-center py-12">
            {browsableGames.length === 0 ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Swords className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Active Battles Found</h3>
                  <p className="text-slate-400 mb-6">
                    Be the first warrior to create a battle!
                  </p>
                  <Link href="/create">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl">
                      <Zap className="w-5 h-5 mr-2" />
                      CREATE BATTLE
                    </Button>
                  </Link>
                </div>
              </div>
            ) : selectedFilter === "can-join" && browsableGames.length > 0 ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-amber-800 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-12 h-12 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Games You Can Join</h3>
                  <p className="text-slate-400 mb-6">
                    You have already bet on all available games or they are full.
                  </p>
                  <div className="space-x-4">
                    <Button
                      onClick={() => setSelectedFilter("all")}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      View All Games
                    </Button>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl">
                        <Zap className="w-5 h-5 mr-2" />
                        CREATE BATTLE
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Filter className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Battles Match Your Filter</h3>
                  <p className="text-slate-400 mb-6">
                    No battles match your search "{searchTerm}" or filter "{selectedFilter}"
                  </p>
                  <div className="space-x-4">
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedFilter("all")
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl"
                    >
                      Clear Filters
                    </Button>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl">
                        <Zap className="w-5 h-5 mr-2" />
                        CREATE BATTLE
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!isLoading && contractsReady && providerReady && browsableGames.length > 0 && (
          <div className="mt-12 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Battle Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{browseStats.totalGames}</div>
                <div className="text-sm text-slate-400">Total Battles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{browseStats.quickDrawGames}</div>
                <div className="text-sm text-slate-400">Quick Draw</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{browseStats.strategicGames}</div>
                <div className="text-sm text-slate-400">Strategic</div>
              </div>
              {/* <div>
                <div className="text-2xl font-bold text-rose-400">{browseStats.hardcoreMysteryGames}</div>
                <div className="text-sm text-slate-400">Hardcore Mystery</div>
              </div> */}
              <div>
                <div className="text-2xl font-bold text-amber-400">{browseStats.totalPrizePool} MNT</div>
                <div className="text-sm text-slate-400">Total Prize Pool</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-xl font-bold text-amber-400">{browseStats.waitingGames}</div>
                  <div className="text-sm text-slate-400">Waiting for Players</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-400">{browseStats.activeGames}</div>
                  <div className="text-sm text-slate-400">Active Battles</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hardcore Mystery Contract Status */}
      
        {/* ZeroSum Contract Status */}
       
        {/* Debug Panel - Show when connected */}
        {isConnected && showDebug && (
          <div className="mt-8 p-6 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Current Address:</p>
                <p className="font-mono text-cyan-400">{address}</p>
              </div>
              <div>
                <p className="text-slate-400">Previous Address:</p>
                <p className="font-mono text-slate-300">{previousAddress}</p>
              </div>
              <div>
                <p className="text-slate-400">Games with bets:</p>
                <div className="text-xs text-slate-300 max-h-32 overflow-y-auto">
                  {browsableGames.filter(g => g.userHasBet).map(game => (
                    <div key={game.gameId} className="mb-2 p-2 bg-slate-700/30 rounded">
                      <div className="font-medium">Game #{game.gameId} ({game.contractType})</div>
                      <div className="text-slate-400">
                        Players: {game.players.length}
                        {game.players.some(p => p.toLowerCase() === address?.toLowerCase()) && " (You're in this game)"}
                      </div>
                    </div>
                  ))}
                  {browsableGames.filter(g => g.userHasBet).length === 0 && "None"}
                </div>
              </div>
              <div>
                <p className="text-slate-400">Can join games:</p>
                <p className="text-emerald-400">
                  {browsableGames.filter(g => getGameDynamicProps(g).canJoin).length} / {browsableGames.length}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Last refresh:</p>
                <p className="text-slate-300">{lastFetchTime}</p>
              </div>
              <div>
                <p className="text-slate-400">Cannot join reason:</p>
                <div className="text-xs text-slate-300">
                  {browsableGames.filter(g => !getGameDynamicProps(g).canJoin && !g.userHasBet && !getGameDynamicProps(g).isCreator).map(game => (
                    <div key={game.gameId} className="mb-1">
                      Game #{game.gameId}: {game.players.length >= 2 ? 'Full' : 'Other reason'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400">Betting attempts:</p>
                <div className="text-xs text-slate-300">
                  {Array.from(userBettingAttempts).map((attempt, index) => (
                    <div key={index} className="mb-1">
                      {attempt}
                    </div>
                  ))}
                  {userBettingAttempts.size === 0 && "None"}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                💡 This panel shows your current betting status. If you switch addresses, 
                click the refresh button above to update your bet status for the new address.
              </p>
              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <p><strong>Betting Status Meanings:</strong></p>
                <p>• <span className="text-emerald-400">Can Join:</span> You can join as a player</p>
                <p>• <span className="text-amber-400">Already Bet:</span> You're in the game or have attempted to bet</p>
                <p>• <span className="text-blue-400">Betting Attempt:</span> Frontend tracking of your betting activity</p>
                <p>• <span className="text-green-400">Can Bet:</span> You can place a spectator bet</p>
              </div>
              <div className="mt-2">
                <Button
                  onClick={clearBettingAttempts}
                  size="sm"
                  variant="outline"
                  className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Clear Betting Attempts
                </Button>
                <Button
                  onClick={fetchBrowsableGames}
                  size="sm"
                  variant="outline"
                  className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 ml-2"
                >
                  Refresh Bet Status
                </Button>
              </div>
            </div>
          </div>
        )}

     
      </div>
    </div>
  )
}