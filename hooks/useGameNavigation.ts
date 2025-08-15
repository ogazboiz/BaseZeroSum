// hooks/useGameNavigation.ts - ENHANCED version that builds on your existing code
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameContext } from '@/context/GameContext'
import { toast } from 'react-hot-toast'

export function useGameNavigation() {
  const router = useRouter()
  const { setCurrentGame, getGameById, fetchMyGames, preloadGame } = useGameContext()

  // Your original navigateToGame function - enhanced with better logging and error handling
  const navigateToGame = useCallback((gameId: number) => {
    console.log(`🎯 Navigating to game ${gameId}`)
    
    try {
      // Set the current game in context before navigating
      const game = getGameById(gameId)
      if (game) {
        setCurrentGame(game)
        console.log('🎯 Pre-fetched game data for navigation:', {
          gameId: game.gameId,
          status: game.status,
          mode: game.mode,
          isMyTurn: game.myTurn,
          lastUpdated: new Date(game.lastUpdated || 0).toLocaleTimeString()
        })
        
        // Show success feedback for cached data
        toast.success(`Opening ${game.status} game #${gameId}`, {
          duration: 2000,
          icon: "🎮"
        })
      } else {
        console.warn(`⚠️ No game data found for game ${gameId}, navigating anyway`)
        // Clear current game so battle page knows to load fresh
        setCurrentGame(null)
        
        // Show loading feedback
        toast.loading(`Loading game #${gameId}...`, {
          duration: 3000,
          icon: "⏳"
        })
      }
      
      // Navigate to the battle page
      router.push(`/battle/${gameId}`)
      
    } catch (error) {
      console.error(`❌ Failed to navigate to game ${gameId}:`, error)
      toast.error(`Failed to open game #${gameId}`)
    }
  }, [router, setCurrentGame, getGameById])

  // Your original navigateToGameWithMode function - enhanced
  const navigateToGameWithMode = useCallback((gameId: number, mode: string) => {
    console.log(`🎯 Navigating to game ${gameId} with mode ${mode}`)
    
    try {
      // Set the current game in context before navigating
      const game = getGameById(gameId)
      if (game) {
        setCurrentGame(game)
        console.log('🎯 Pre-fetched game data for navigation:', {
          gameId: game.gameId,
          status: game.status,
          mode: game.mode,
          requestedMode: mode,
          isMyTurn: game.myTurn
        })
        
        // Show success feedback
        toast.success(`Opening ${game.mode} game #${gameId}`, {
          duration: 2000,
          icon: "🎮"
        })
      } else {
        console.warn(`⚠️ No game data found for game ${gameId}, navigating anyway`)
        setCurrentGame(null)
        
        // Show loading feedback
        toast.loading(`Loading ${mode} game #${gameId}...`, {
          duration: 3000,
          icon: "⏳"
        })
      }
      
      // Navigate to the battle page with mode parameter
      router.push(`/battle/${gameId}?mode=${mode}`)
      
    } catch (error) {
      console.error(`❌ Failed to navigate to game ${gameId} with mode ${mode}:`, error)
      toast.error(`Failed to open game #${gameId}`)
    }
  }, [router, setCurrentGame, getGameById])

  // NEW: Enhanced navigation for urgent games (when it's your turn)
  const navigateToUrgentGame = useCallback(async (gameId: number) => {
    console.log(`🚨 Navigating to URGENT game ${gameId} (your turn!)`)
    
    try {
      // Try to get fresh data for urgent games
      let game = getGameById(gameId)
      
      // If game data is older than 30 seconds, refresh it
      if (game && game.lastUpdated && Date.now() - game.lastUpdated > 30000) {
        console.log(`🔄 Refreshing data for urgent game ${gameId}`)
        // Try to preload fresh data
        const freshGame = await preloadGame?.(gameId)
        if (freshGame) {
          game = freshGame
        }
      }
      
      if (game) {
        setCurrentGame(game)
        console.log('🚨 Urgent game data:', {
          gameId: game.gameId,
          timeLeft: game.timeLeft,
          myTurn: game.myTurn,
          status: game.status
        })
        
        // Show urgent feedback
        toast.success(`🚨 Your turn in ${game.mode} #${gameId}!`, {
          duration: 4000,
          icon: "⚡"
        })
      } else {
        setCurrentGame(null)
        toast.loading(`Loading urgent game #${gameId}...`, {
          duration: 3000,
          icon: "🚨"
        })
      }
      
      router.push(`/battle/${gameId}`)
      
    } catch (error) {
      console.error(`❌ Failed to navigate to urgent game ${gameId}:`, error)
      // Fallback to normal navigation
      navigateToGame(gameId)
    }
  }, [router, setCurrentGame, getGameById, preloadGame, navigateToGame])

  // NEW: Smart navigation that chooses the best method based on game context
  const navigateToGameSmart = useCallback(async (gameId: number, context?: {
    isMyTurn?: boolean
    timeLeft?: number
    status?: string
    mode?: string
    source?: string
  }) => {
    console.log(`🧠 Smart navigation to game ${gameId}`, context)
    
    try {
      // For urgent games (your turn with low time), use urgent navigation
      if (context?.isMyTurn && context?.timeLeft !== undefined && context.timeLeft < 120) {
        return navigateToUrgentGame(gameId)
      }
      
      // For active games, try to refresh data first
      if (context?.status === 'active') {
        console.log(`🔄 Active game detected, attempting to refresh before navigation`)
        try {
          if (preloadGame) {
            await preloadGame(gameId)
          }
        } catch (error) {
          console.warn(`Could not preload game ${gameId}, continuing with cached data`)
        }
      }
      
      // Use mode navigation if mode is provided
      if (context?.mode) {
        return navigateToGameWithMode(gameId, context.mode)
      }
      
      // Default to basic navigation
      return navigateToGame(gameId)
      
    } catch (error) {
      console.error(`❌ Smart navigation failed for game ${gameId}:`, error)
      // Always fallback to basic navigation
      return navigateToGame(gameId)
    }
  }, [navigateToGame, navigateToGameWithMode, navigateToUrgentGame, preloadGame])

  // NEW: Navigation with automatic context refresh
  const navigateToGameWithRefresh = useCallback(async (gameId: number, forceRefresh = false) => {
    console.log(`🔄 Navigate to game ${gameId} with refresh (force: ${forceRefresh})`)
    
    try {
      // Refresh games if needed
      if (forceRefresh || !getGameById(gameId)) {
        console.log(`🔄 Refreshing game context before navigation`)
        await fetchMyGames(true)
      }
      
      // Navigate with fresh data
      navigateToGame(gameId)
      
    } catch (error) {
      console.error(`❌ Failed to navigate with refresh to game ${gameId}:`, error)
      // Fallback to basic navigation
      navigateToGame(gameId)
    }
  }, [navigateToGame, getGameById, fetchMyGames])

  // Additional navigation helpers
  const navigateToMyGames = useCallback(() => {
    console.log(`🚀 Navigating to My Games`)
    router.push('/my-games')
  }, [router])

  const navigateToBrowse = useCallback(() => {
    console.log(`🚀 Navigating to Browse`)
    router.push('/browse')
  }, [router])

  const navigateToCreate = useCallback((mode?: 'quick-draw' | 'strategic') => {
    console.log(`🚀 Navigating to Create${mode ? ` (${mode})` : ''}`)
    const url = mode ? `/create?mode=${mode}` : '/create'
    router.push(url)
  }, [router])

  const navigateBack = useCallback(() => {
    console.log(`🚀 Navigating back`)
    router.back()
  }, [router])

  return {
    // Your original functions (maintained for compatibility)
    navigateToGame,
    navigateToGameWithMode,
    
    // Enhanced navigation methods
    navigateToUrgentGame,
    navigateToGameSmart,
    navigateToGameWithRefresh,
    
    // Additional helpers
    navigateToMyGames,
    navigateToBrowse,
    navigateToCreate,
    navigateBack,
    
    // Utility
    router
  }
}