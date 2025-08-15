# Game Context System

## Overview

The Game Context system solves the issue where game data was lost when navigating between pages. Previously, when you clicked on a game from the My Games page to go to the Battle page, the game data had to be fetched from scratch, causing loading delays. When you went back to My Games, the data was lost and showed "no games".

## How It Works

### 1. Centralized Game Data Management

The `GameContext` (`context/GameContext.tsx`) acts as a central store for all game data:
- Fetches and caches user games
- Maintains game statistics
- Provides real-time updates
- Persists data across page navigation

### 2. Smart Navigation with Pre-fetching

The `useGameNavigation` hook (`hooks/useGameNavigation.ts`) ensures smooth transitions:
- When clicking on a game, it sets the current game in context BEFORE navigating
- The Battle page can immediately access pre-fetched game data
- No more loading delays when entering a battle

### 3. Data Persistence

Game data is maintained in the context even when:
- Navigating between pages
- Refreshing the browser
- Switching wallet addresses
- Component re-renders

## Key Components

### GameContext Provider
```tsx
// Wraps the entire app in providers.tsx
<GameProvider>
  {children}
</GameProvider>
```

### useGameContext Hook
```tsx
const { 
  myGames,           // All user games
  gameStats,         // Game statistics
  currentGame,       // Currently selected game
  fetchMyGames,      // Fetch games from blockchain
  refreshGame,       // Refresh specific game
  setCurrentGame,    // Set current game
  getGameById        // Get game by ID
} = useGameContext()
```

### useGameNavigation Hook
```tsx
const { navigateToGame } = useGameNavigation()

// Navigate to game with pre-fetched data
navigateToGame(gameId)
```

## Usage Examples

### My Games Page
```tsx
// Uses context instead of local hook
const { myGames, gameStats, isLoading } = useGameContext()

// Navigation with pre-fetching
const { navigateToGame } = useGameNavigation()

<Button onClick={() => navigateToGame(game.gameId)}>
  Continue Game
</Button>
```

### Battle Page
```tsx
// Gets pre-fetched game data from context
const { getGameById, setCurrentGame } = useGameContext()

// Pre-fetched data is immediately available
const preFetchedGame = getGameById(gameId)
if (preFetchedGame) {
  setCurrentGame(preFetchedGame)
}
```

## Benefits

1. **Instant Navigation**: No loading delays when entering battles
2. **Data Persistence**: Game data survives page navigation
3. **Better UX**: Smooth transitions between pages
4. **Centralized State**: Single source of truth for game data
5. **Real-time Updates**: Automatic polling and refresh
6. **Smart Caching**: Reduces blockchain calls

## Data Flow

1. **My Games Page** loads and fetches games via context
2. **User clicks game** → `navigateToGame()` sets current game in context
3. **Battle Page** loads with pre-fetched data immediately available
4. **Game state updates** are reflected in both pages via context
5. **Navigation back** preserves all game data

## Cache Strategy

- **Game Data**: 30-second cache duration
- **Smart Polling**: More frequent updates for active games
- **Batch Processing**: Efficient blockchain calls
- **Memory Management**: Automatic cleanup of old cache entries

## Troubleshooting

### Games Not Loading
- Check if wallet is connected
- Verify GameProvider is wrapping the app
- Check browser console for context logs

### Navigation Issues
- Ensure `navigateToGame()` is called before navigation
- Verify game data exists in context before navigating
- Check that `setCurrentGame()` is working

### Performance Issues
- Reduce polling frequency if needed
- Check cache duration settings
- Monitor blockchain call frequency
