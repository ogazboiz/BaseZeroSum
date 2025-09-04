// Centralized app configuration - easily updateable
export const APP_CONFIG = {
  // App metadata
  name: "ZeroSum Gaming Arena",
  description: "Mathematical warfare where strategy beats luck",
  tagline: "Enter the arena where strategy beats luck. Mathematical warfare with hidden numbers and true fairness.",
  
  // URLs and assets
  url: process.env.NEXT_PUBLIC_URL || "https://zerosum-arena.vercel.app",
  icon: "/logo.png",
  ogImage: "/og.png",
  splashImage: "/splash.png",
  
  // Theme
  themeColor: "#06b6d4",
  backgroundColor: "#0f172a",
  
  // Contract addresses (Base Sepolia)
  contracts: {
    game: "0x11bb298BBde9fFa6747ea104C2c39b3E59a399B4",
    spectator: "0x214124ae23b415b3AEA3bb9e260A56dc022bAf04",
  },
  
  // Network configuration
  network: {
    chainId: 84532, // Base Sepolia
    rpcUrl: "https://base-sepolia.drpc.org",
    name: "Base Sepolia",
    currency: "ETH",
  },
  
  // Game settings
  game: {
    quickDrawMinFee: "0.0001",
    strategicMinFee: "0.001",
    timeoutSeconds: 90,
    maxTimeouts: 2,
    maxRounds: 15,
  },
  
  // Farcaster settings
  farcaster: {
    frameTitle: "Launch ZeroSum Arena",
    frameName: "ZeroSum Gaming Arena",
    frameDescription: "Mathematical warfare where strategy beats luck",
  },
  
  // Social links
  social: {
    twitter: "https://twitter.com/zerosumarena",
    discord: "https://discord.gg/zerosumarena",
    github: "https://github.com/zerosumarena",
  },
  
  // Features
  features: {
    quickDraw: {
      name: "Quick Draw",
      description: "Subtract 1 each turn - reach 0 to WIN!",
      minFee: "0.0001",
      maxFee: "1.0",
      avgDuration: "2-5 min",
    },
    strategic: {
      name: "Strategic",
      description: "DON'T reach 0 - force opponent to hit 0!",
      minFee: "0.01",
      maxFee: "2.0",
      avgDuration: "5-15 min",
    },
  },
  
  // Development settings
  dev: {
    debugMode: process.env.NODE_ENV === 'development',
    enableLogging: true,
    rpcRateLimit: 3, // Max concurrent requests
  }
} as const;

// Export individual configs for easy access
export const { contracts, network, game, farcaster, features } = APP_CONFIG;
