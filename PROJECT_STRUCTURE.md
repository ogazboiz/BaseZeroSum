# ZeroSum Gaming Application - Project Structure

## 📁 Root Directory Structure

```
zerosum-fe/
├── 📁 app/                          # Next.js 13+ App Router
├── 📁 components/                   # React Components
├── 📁 hooks/                       # Custom React Hooks
├── 📁 lib/                         # Utility Libraries
├── 📁 config/                      # Configuration Files
├── 📁 context/                     # React Context Providers
├── 📁 styles/                      # Global Styles
├── 📁 public/                      # Static Assets
├── 📁 .next/                       # Next.js Build Output
├── 📁 node_modules/                # Dependencies
├── 📄 package.json                 # Project Dependencies
├── 📄 tsconfig.json               # TypeScript Configuration
├── 📄 next.config.mjs             # Next.js Configuration
├── 📄 components.json              # shadcn/ui Configuration
├── 📄 README-CONTRACTS.md          # Smart Contract Documentation
├── 📄 REAL_GAMEPLAY_SETUP.md      # Real Blockchain Setup Guide
└── 📄 PROJECT_STRUCTURE.md         # This File
```

## 🚀 App Router Structure (`/app`)

### Core Pages
```
app/
├── 📄 layout.tsx                   # Root Layout with Providers
├── 📄 page.tsx                     # Home/Arena Page
├── 📄 globals.css                  # Global CSS Variables
├── 📁 create/                      # Game Creation
│   └── 📄 page.tsx                # Create New Game Form
├── 📁 browse/                      # Browse Active Games
│   └── 📄 page.tsx                # Game Browser with Battle Cards
├── 📁 battle/                      # Game Battle System
│   ├── 📄 [id]/page.tsx           # Main Battle Interface
│   ├── 📄 join/[id]/page.tsx      # Join Existing Battle
│   └── 📄 waiting/[id]/page.tsx   # Waiting Room for Game Creator
├── 📁 my-games/                    # User's Game Management
│   └── 📄 page.tsx                # Active/Waiting/Completed Games
├── 📁 spectate/                    # Game Spectating
│   └── 📄 [id]/page.tsx           # Spectate Active Battles
├── 📁 tournaments/                 # Tournament System
│   └── 📄 page.tsx                # Tournament Management
├── 📁 staking/                     # Staking & Rewards
│   └── 📄 page.tsx                # Staking Interface
├── 📁 profile/                     # User Profile
│   └── 📄 page.tsx                # User Stats & Settings
└── 📁 ai/                          # AI Integration
    └── 📄 page.tsx                # AI Game Modes
```

## 🧩 Components Structure (`/components`)

### Core Component Categories
```
components/
├── 📄 index.ts                     # Component Exports
├── 📄 theme-provider.tsx           # Theme Context Provider
├── 📁 ui/                          # shadcn/ui Base Components
│   ├── 📄 button.tsx              # Button Component
│   ├── 📄 card.tsx                # Card Component
│   ├── 📄 input.tsx               # Input Component
│   ├── 📄 badge.tsx               # Badge Component
│   ├── 📄 progress.tsx            # Progress Bar
│   ├── 📄 slider.tsx              # Slider Component
│   └── 📄 ...                     # Other UI Components
├── 📁 shared/                      # Shared/Common Components
│   ├── 📄 GamingNavigation.tsx    # Main Navigation Bar
│   ├── 📄 MyGamesDropdown.tsx     # Games Dropdown Menu
│   ├── 📄 NetworkStatus.tsx       # Network Connection Status
│   └── 📄 ...                     # Other Shared Components
├── 📁 game/                        # Game-Specific Components
│   ├── 📄 GameSettings.tsx        # Game Configuration
│   ├── 📄 GameBoard.tsx           # Game Board Interface
│   └── 📄 ...                     # Other Game Components
├── 📁 game-creation/               # Game Creation Components
│   ├── 📄 CreateGameForm.tsx      # Game Creation Form
│   ├── 📄 GameModeSelector.tsx    # Game Mode Selection
│   └── 📄 ...                     # Other Creation Components
├── 📁 battle/                      # Battle System Components
│   ├── 📄 BattleCard.tsx          # Battle Display Card
│   ├── 📄 BattleTimer.tsx         # Battle Countdown Timer
│   ├── 📄 MoveHistory.tsx         # Move History Display
│   └── 📄 ...                     # Other Battle Components
└── 📁 debug/                       # Debug/Development Components
    ├── 📄 DebugPanel.tsx          # Debug Information Panel
    └── 📄 ...                     # Other Debug Components
```

## 🪝 Hooks Structure (`/hooks`)

### Custom React Hooks
```
hooks/
├── 📄 index.ts                     # Hook Exports
├── 📄 useZeroSumContract.ts        # Smart Contract Interactions
│   ├── createQuickDraw()           # Create Quick Draw Game
│   ├── createStrategic()           # Create Strategic Game
│   ├── joinGame()                  # Join Existing Game
│   ├── makeMove()                  # Submit Game Move
│   ├── handleTimeout()             # Handle Turn Timeout
│   └── ...                         # Other Contract Functions
├── 📄 useZeroSumData.ts            # Blockchain Data Reading
│   ├── getGame()                   # Get Game Data
│   ├── getPlayers()                # Get Game Players
│   ├── getPlayerView()             # Get Player's Game View
│   ├── getGameCounter()            # Get Total Games Count
│   └── ...                         # Other Data Functions
├── 📄 useBrowseGames.ts            # Browse Active Games
├── 📄 useMyGames.ts                # User's Games Management
├── 📄 usePlayerStats.ts            # Player Statistics
├── 📄 use-mobile.ts                # Mobile Device Detection
└── 📄 use-toast.ts                 # Toast Notifications
```

## ⚙️ Configuration & Utilities (`/config`, `/lib`, `/context`)

### Configuration Files
```
config/
├── 📄 constants.ts                 # Application Constants
├── 📄 game-modes.ts                # Game Mode Definitions
├── 📄 blockchain.ts                # Blockchain Configuration
└── 📄 ...                          # Other Config Files
```

### Utility Libraries
```
lib/
├── 📄 utils.ts                     # General Utility Functions
├── 📄 blockchain.ts                # Blockchain Helper Functions
├── 📄 validation.ts                # Input Validation Functions
└── 📄 ...                          # Other Utility Files
```

### Context Providers
```
context/
├── 📄 GameContext.tsx              # Game State Context
├── 📄 WalletContext.tsx            # Wallet Connection Context
└── 📄 ...                          # Other Context Files
```

## 🎨 Styles Structure (`/styles`)

### Styling Files
```
styles/
├── 📄 globals.css                  # Global CSS Variables
├── 📄 components.css               # Component-Specific Styles
├── 📄 animations.css               # CSS Animations
└── 📄 ...                          # Other Style Files
```

## 📱 Public Assets (`/public`)

### Static Assets
```
public/
├── 📁 images/                      # Image Assets
├── 📁 icons/                       # Icon Assets
├── 📁 fonts/                       # Font Files
└── 📄 ...                          # Other Static Assets
```

## 🔧 Key Features by Directory

### 🎮 Game Logic (`/app/battle`, `/components/battle`)
- Real-time battle interface
- Turn-based gameplay
- Move submission and validation
- Timer management
- Game state synchronization

### 🏗️ Game Creation (`/app/create`, `/components/game-creation`)
- Game mode selection
- Entry fee configuration
- Game parameter setup
- Smart contract integration

### 🔍 Game Discovery (`/app/browse`, `/components/battle`)
- Active games listing
- Game filtering and search
- Join game functionality
- Creator protection logic

### 👤 User Management (`/app/my-games`, `/app/profile`)
- Personal game history
- Game statistics
- Profile management
- Game recovery system

### 🌐 Blockchain Integration (`/hooks/useZeroSumContract`)
- Smart contract interactions
- Transaction handling
- Real-time data fetching
- Error handling and recovery

## 📋 Development Guidelines

### File Naming Conventions
- **Components**: PascalCase (e.g., `BattleCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useZeroSumContract.ts`)
- **Pages**: lowercase with hyphens (e.g., `my-games/page.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)

### Import Organization
1. React and Next.js imports
2. Third-party library imports
3. Internal component imports
4. Hook imports
5. Utility and type imports

### Component Structure
- Export default function
- Props interface definition
- State management
- Event handlers
- JSX return with proper TypeScript

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Fallback UI states
- Network error detection

## 🚀 Getting Started

1. **Install Dependencies**: `npm install` or `pnpm install`
2. **Environment Setup**: Configure blockchain endpoints
3. **Smart Contract**: Deploy ZeroSum contract (see README-CONTRACTS.md)
4. **Development**: `npm run dev` or `pnpm dev`
5. **Build**: `npm run build` or `pnpm build`

## 📚 Documentation Files

- **README-CONTRACTS.md**: Smart contract setup and deployment
- **REAL_GAMEPLAY_SETUP.md**: Real blockchain gameplay configuration
- **PROJECT_STRUCTURE.md**: This comprehensive structure guide

This structure provides a scalable, maintainable foundation for your ZeroSum gaming application with clear separation of concerns and organized file management.
