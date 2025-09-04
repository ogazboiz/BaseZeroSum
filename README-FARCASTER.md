
# 🚀 ZeroSum Farcaster Mini App

A mathematical warfare game deployed as a Farcaster Mini App, following the official Coinbase OnchainKit documentation.

## 📁 **Centralized Configuration**

All app metadata and configuration is centralized in `config/app-config.ts` for easy updates:

```typescript
// config/app-config.ts
export const APP_CONFIG = {
  name: "ZeroSum Gaming Arena",
  description: "Mathematical warfare where strategy beats luck",
  url: "https://zerosum.arena",
  contracts: {
    game: "0x11bb298BBde9fFa6747ea104C2c39b3E59a399B4",
    spectator: "0x214124ae23b415b3AEA3bb9e260A56dc022bAf04",
  },
  // ... more config
}
```

## 🛠 **Setup Complete**

### ✅ **Files Created/Updated:**

1. **`config/app-config.ts`** - Centralized configuration
2. **`app/metadata.ts`** - Dynamic metadata using config
3. **`providers/MiniKitProvider.tsx`** - MiniKit provider (uses `base` chain)
4. **`app/page.tsx`** - MiniKit initialization with `useMiniKit()`
5. **`scripts/generate-farcaster-manifest.js`** - CLI script for manifest generation
6. **`deploy-farcaster.sh`** - Complete deployment script

### 🔧 **MiniKit Integration:**

- **Provider**: Wraps app with `MiniKitProvider` using `base` chain
- **Initialization**: Uses `useMiniKit()` to call `setFrameReady()`
- **Farcaster Frame**: Proper `fc:frame` metadata for Mini App detection

## 🚀 **Deployment Steps:**

### 1. **Build & Deploy:**
```bash
npm run build
npx vercel --prod
```

### 2. **Generate Farcaster Manifest:**
```bash
node scripts/generate-farcaster-manifest.js
# OR
npx create-onchain --manifest
```

### 3. **Update Environment:**
Add to `.env.local`:
```bash
NEXT_PUBLIC_CDP_CLIENT_API_KEY=your_coinbase_api_key
FARCASTER_HEADER=generated_header
FARCASTER_PAYLOAD=generated_payload
FARCASTER_SIGNATURE=generated_signature
```

### 4. **Test in Farcaster:**
- Share your deployed URL in a Farcaster cast
- The link should automatically open as a Mini App
- Users can connect their Farcaster wallet and play!

## 📱 **Farcaster Mini App Features:**

- ✅ **Farcaster Wallet Connection** - Primary connector
- ✅ **Base Network** - Low-cost transactions
- ✅ **Mobile Optimized** - Responsive design
- ✅ **Frame Integration** - Proper Mini App detection
- ✅ **Centralized Config** - Easy to update metadata

## 🎮 **Game Features:**

- **Quick Draw Mode**: Subtract 1 each turn (0.0001 ETH min)
- **Strategic Mode**: Strategic moves (0.001 ETH min)
- **90-Second Timers**: Contract-based timeout system
- **Real-time Updates**: Polling for game state changes
- **Prize Pools**: Win ETH from opponents

## 🔄 **Easy Updates:**

To update app metadata, simply edit `config/app-config.ts`:

```typescript
export const APP_CONFIG = {
  name: "Your New App Name",
  url: "https://your-new-domain.com",
  contracts: {
    game: "0x...", // New contract address
  },
  // ... other updates
}
```

All metadata, Farcaster frames, and app configuration will automatically update!

## 📊 **Contract Addresses (Base Sepolia):**

- **Game Contract**: `0x11bb298BBde9fFa6747ea104C2c39b3E59a399B4`
- **Spectator Contract**: `0x214124ae23b415b3AEA3bb9e260A56dc022bAf04`

Your ZeroSum game is now ready for Farcaster deployment! 🎉
