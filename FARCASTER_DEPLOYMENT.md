# 🚀 ZeroSum Farcaster Mini App Deployment Guide

## ✅ **Setup Complete!**

Your ZeroSum game is now configured for Farcaster deployment, following the same pattern as mintmymood.

### **Key Features Added:**
- ✅ **Farcaster Frame Integration** - `fc:frame` metadata for proper Mini App detection
- ✅ **Coinbase OnchainKit** - Enhanced Farcaster wallet integration
- ✅ **Optimized Connector Order** - `farcasterMiniApp()` as primary connector
- ✅ **OpenGraph Images** - Custom OG image for Farcaster sharing
- ✅ **Mobile-Optimized** - Proper viewport and manifest settings

## 🚀 **Deployment Steps:**

### 1. **Build the Project**
```bash
cd ZeroSum-FE
npm run build
```

### 2. **Deploy to Vercel**
```bash
npx vercel --prod
```

### 3. **Test in Farcaster**
- Share your deployed URL in a Farcaster cast
- The link should automatically open as a Mini App
- Users can connect their Farcaster wallet and play!

## 📱 **Farcaster Mini App Features:**

### **Wallet Connection:**
- Primary: Farcaster Mini App connector
- Fallback: MetaMask, Coinbase Wallet, WalletConnect

### **Game Features:**
- Create Quick Draw games (0.0001 ETH min)
- Create Strategic games (0.001 ETH min)
- Join games with Farcaster wallet
- Real-time gameplay with 90-second timers
- Base Sepolia testnet for low-cost transactions

### **Mobile Optimization:**
- Responsive design for mobile screens
- Touch-friendly controls
- Proper viewport settings
- App manifest for PWA features

## 🔧 **Environment Variables Needed:**

Create `.env.local`:
```bash
NEXT_PUBLIC_CDP_CLIENT_API_KEY=your_coinbase_api_key
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
```

## 📊 **Contract Addresses (Base Sepolia):**
- **Game Contract:** `0x11bb298BBde9fFa6747ea104C2c39b3E59a399B4`
- **Spectator Contract:** `0x214124ae23b415b3AEA3bb9e260A56dc022bAf04`

## 🎮 **How to Play:**
1. Connect Farcaster wallet
2. Create or join a game
3. Make strategic moves to reach 0
4. Win ETH prizes!

Your ZeroSum game is now ready for Farcaster! 🎉
