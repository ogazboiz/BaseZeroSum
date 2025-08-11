# ZeroSum Contract Integration

This project has been updated to integrate with the ZeroSum smart contracts on the Mantle network.

## Contract Addresses

- **ZeroSum Simplified**: `0x3b4B128d79cC2e0d9Af4f429A9bc74cD01bE6B7a`
- **ZeroSum Spectator**: `0x1bE77b80eE1729e4ad52243f0A5d109a2F266F89`

## Available Functions

### ZeroSum Simplified Contract
- `MAX_TIMEOUTS()` - View function to get maximum allowed timeouts
- `balances(uint256 gameId, address player)` - View function to get player balance for a specific game
- `enableLastStandBetting(uint256 gameId)` - Enable last stand betting for a game
- `finalizeGameBetting(uint256 gameId)` - Finalize betting for a game
- `updateLastStandRound(uint256 gameId)` - Update the last stand round for a game

### ZeroSum Spectator Contract
- `getGameForSpectators(uint256 gameId)` - Get the current status of a game

## Game Status Enum

```typescript
enum GameStatus {
  PENDING = 0,
  ACTIVE = 1,
  FINISHED = 2,
  CANCELLED = 3
}
```

## Usage Examples

### Reading Contract Data

```typescript
import { useGameStatus, useMaxTimeouts, usePlayerBalance } from '@/hooks/use-contracts';

function MyComponent() {
  const { data: gameStatus } = useGameStatus(BigInt(1));
  const { data: maxTimeouts } = useMaxTimeouts();
  const { data: playerBalance } = usePlayerBalance(BigInt(1), '0x...');
  
  // Use the data...
}
```

### Writing to Contracts

```typescript
import { useEnableLastStandBetting } from '@/hooks/use-contracts';

function MyComponent() {
  const { write: enableLastStandBetting, isLoading } = useEnableLastStandBetting(BigInt(1));
  
  const handleEnable = () => {
    if (enableLastStandBetting) {
      enableLastStandBetting();
    }
  };
  
  return (
    <button onClick={handleEnable} disabled={isLoading}>
      Enable Last Stand Betting
    </button>
  );
}
```

### Using Contract Addresses

```typescript
import { CONTRACT_ADDRESSES } from '@/config';

console.log(CONTRACT_ADDRESSES.ZERO_SUM_SIMPLIFIED);
console.log(CONTRACT_ADDRESSES.ZERO_SUM_SPECTATOR);
```

## Available Hooks

- `useGameStatus(gameId)` - Read game status
- `useMaxTimeouts()` - Read maximum timeouts
- `usePlayerBalance(gameId, playerAddress)` - Read player balance
- `useEnableLastStandBetting(gameId)` - Enable last stand betting
- `useFinalizeGameBetting(gameId)` - Finalize game betting
- `useUpdateLastStandRound(gameId)` - Update last stand round

## Utility Functions

- `getGameStatusString(status)` - Convert GameStatus enum to readable string

## Example Component

See `components/contracts/ContractExample.tsx` for a complete example of how to use all the contract functions.

## Configuration

The contracts are configured in:
- `config/contracts.ts` - Contract addresses and metadata
- `config/abis/` - Contract ABIs
- `context/wagmi-config.js` - Wagmi configuration for Mantle network

## Network Support

- Mantle Mainnet
- Mantle Sepolia Testnet
- Sepolia (fallback)

## Dependencies

- `wagmi` - Ethereum hooks and utilities
- `@tanstack/react-query` - Data fetching and caching
- `viem` - Ethereum TypeScript interface
