"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gamepad2,
  Users,
  Eye,
  Coins,
  Zap,
  Target,
  Brain,
  ArrowRight,
  TrendingUp,
  Shield,
  Play,
  Swords,
  Crown,
  Flame,
  Wallet,
  User,
  LogOut,
  Settings,
  ExternalLink,
  Bell,
  Menu,
  X,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAccount, useDisconnect } from "wagmi"
import { toast } from "react-hot-toast"
import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"
import { useMiniKit } from '@coinbase/onchainkit/minikit'

// Mock balance hooks - replace with your actual balance hooks
const useMNTBalance = (address: string | undefined) => {
  return {
    formatted: "2.45",
    isLoading: false,
    error: null,
    refetch: () => {}
  }
}

const useZSTokenBalance = (address: string | undefined) => {
  return {
    formatted: "1247",
    isLoading: false,
    error: null,
    refetch: () => {}
  }
}

// Mock player stats hook - replace with your actual stats hook
const usePlayerStats = (address: string | undefined) => {
  return {
    wins: 24,
    losses: 8,
    rank: 47,
    totalEarnings: "12.5 MNT",
    winRate: 75,
    isLoading: false
  }
}

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const router = useRouter()
  const pathname = usePathname()
  const [activeGame, setActiveGame] = useState(0)
  const [pulseEffect, setPulseEffect] = useState(false)
  
  
  // Wallet state
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Navigation items (keeping for reference, but using UnifiedGamingNavigation now)
  const navigation = [
    { name: "ARENA", href: "/" },
    { name: "CREATE", href: "/create" },
    { name: "BATTLES", href: "/browse" },
    { name: "SPECTATE", href: "/spectate" },
    { name: "TOURNAMENTS", href: "/tournaments" },
  ]


  // Wagmi hooks
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()

  // Balance and stats hooks
  const mntBalance = useMNTBalance(address)
  const zsBalance = useZSTokenBalance(address)
  const playerStats = usePlayerStats(address)

  useEffect(() => setMounted(true), [])

  // Call setFrameReady for Farcaster Mini App
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true)
      setTimeout(() => setPulseEffect(false), 1000)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Show success toast when wallet connects
  useEffect(() => {
    if (mounted && isConnected) {
      toast.success("🎮 Wallet connected! Ready to battle!")
    }
  }, [mounted, isConnected])

  const liveStats = {
    playersOnline: "1,247",
    activeGames: "89",
    totalPrizePool: "234.7 MNT",
    biggestWin: "12.5 MNT",
  }

  const featuredGames = [
    {
      id: "quick-draw",
      title: "Quick Draw",
      subtitle: "LIGHTNING FAST",
      description: "First to zero wins! Pure speed and calculation.",
      players: "1v1",
      avgDuration: "2-4 min",
      difficulty: "★★☆☆☆",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgPattern: "from-emerald-50 to-teal-50",
      glowColor: "shadow-emerald-500/30",
      prize: "0.1-2.0 MNT",
      playersActive: 45,
    },
    {
      id: "strategic",
      title: "Strategic",
      subtitle: "MIND GAMES",
      description: "Don't reach zero! Master percentage calculations.",
      players: "1v1",
      avgDuration: "5-8 min",
      difficulty: "★★★☆☆",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgPattern: "from-blue-50 to-indigo-50",
      glowColor: "shadow-blue-500/30",
      prize: "0.25-5.0 MNT",
      playersActive: 32,
    },
    {
      id: "pure-mystery",
      title: "Pure Mystery",
      subtitle: "COMING SOON",
      description: "Numbers stay hidden forever. Pure intuition battle!",
      players: "1v1",
      avgDuration: "3-6 min",
      difficulty: "★★★★☆",
      icon: Eye,
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
      bgPattern: "from-violet-50 to-purple-50",
      glowColor: "shadow-violet-500/30",
      prize: "0.5-10 MNT",
      playersActive: 0,
      comingSoon: true,
    },
    {
      id: "hardcore-mystery",
      title: "Hardcore Mystery",
      subtitle: "COMING SOON",
      description: "One wrong move = game over! Ultimate challenge.",
      players: "1v1",
      avgDuration: "2-5 min",
      difficulty: "★★★★★",
      icon: Zap,
      gradient: "from-rose-400 via-pink-500 to-red-600",
      bgPattern: "from-rose-50 to-pink-50",
      glowColor: "shadow-rose-500/30",
      prize: "1.0-25 MNT",
      playersActive: 0,
      comingSoon: true,
    },
  ]

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ""

  const getWalletIcon = () => {
    const sanitizeImageUrl = (url: string) => {
      if (!url) return null

      try {
        const trimmedUrl = url.trim()

        if (trimmedUrl.startsWith('data:')) {
          return trimmedUrl
        }

        new URL(trimmedUrl)
        return trimmedUrl
      } catch {
        console.warn('Invalid wallet icon URL:', url)
        return null
      }
    }

    // For now, just return the default wallet icon
    // In the future, you can get wallet icon from connector

    if (connector?.icon) {
      const sanitizedUrl = sanitizeImageUrl(connector.icon)
      if (sanitizedUrl) {
        return (
          <Image
            src={sanitizedUrl}
            alt={connector.name || "Wallet"}
            width={20}
            height={20}
            className="w-4 h-4 rounded-full sm:w-5 sm:h-5"
            onError={(e) => {
              (e.currentTarget.style.display = "none")
              console.warn('Failed to load connector icon:', sanitizedUrl)
            }}
            unoptimized
          />
        )
      }
    }

    return <Wallet className="w-4 h-4 text-cyan-400 sm:w-5 sm:h-5" />
  }

  const getWalletName = () => connector?.name || "Battle Wallet"

  const handleConnect = async () => {
    try {
      // For now, show a message to connect via wallet extension
      toast("Please connect your wallet using the browser extension", { icon: "ℹ️" })
    } catch (error: unknown) {
      console.error("Connection error:", error instanceof Error ? error.message : String(error))
      toast.error("Failed to connect wallet. Please try again.")
    }
  }

  const handleDisconnect = () => {
    console.log("Disconnect initiated")
    setIsDropdownOpen(false)
    try {
      disconnect()
      toast.success("Wallet disconnected")
    } catch (error: unknown) {
      console.error("Disconnect error:", error instanceof Error ? error.message : String(error))
    }
  }

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("[data-menu-toggle]")
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleEnterBattle = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to enter battles!")
      return
    }
    router.push("/browse")
  }

  const handleWatchFights = () => {
    router.push("/spectate")
  }

  const handleCreateGame = (gameMode: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to create battles!")
      return
    }
    router.push(`/create?mode=${gameMode}`)
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
                            </div>
                            
      {/* Unified Gaming Navigation */}
      <UnifiedGamingNavigation />





      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full px-6 py-2 mb-8">
            <Flame className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">LIVE NOW</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
              MATHEMATICAL
            </span>
            <br />
            <span className="text-white">WARFARE</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto font-medium">
            Enter the arena where <span className="text-cyan-400 font-bold">strategy beats luck</span>, numbers stay{" "}
            <span className="text-violet-400 font-bold">completely hidden</span>, and only the smartest survive!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              size="lg"
              onClick={handleEnterBattle}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-lg px-12 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:scale-105"
            >
              <Swords className="w-6 h-6 mr-3" />
              {isConnected ? "ENTER BATTLE" : "CONNECT & BATTLE"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleWatchFights}
              className="border-2 border-violet-500 text-violet-400 hover:bg-violet-500/10 font-black text-lg px-12 py-4 rounded-xl bg-transparent backdrop-blur-sm"
            >
              <Eye className="w-6 h-6 mr-3" />
              WATCH FIGHTS
            </Button>
          </div>
        </div>


        {/* Live Stats Bar - Completely Transparent Background */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            {
              label: "FIGHTERS ONLINE",
              value: liveStats.playersOnline,
              icon: Users,
              color: "text-cyan-400",
              bg: "bg-transparent border-cyan-500/20",
              glow: "hover:shadow-cyan-500/20",
              action: () => router.push("/browse"),
            },
            {
              label: "ACTIVE BATTLES",
              value: liveStats.activeGames,
              icon: Swords,
              color: "text-emerald-400",
              bg: "bg-transparent border-emerald-500/20",
              glow: "hover:shadow-emerald-500/20",
              action: () => router.push("/browse"),
            },
            {
              label: "TOTAL PRIZES",
              value: liveStats.totalPrizePool,
              icon: TrendingUp,
              color: "text-violet-400",
              bg: "bg-transparent border-violet-500/20",
              glow: "hover:shadow-violet-500/20",
              action: () => router.push("/tournaments"),
            },
            {
              label: "BIGGEST WIN",
              value: liveStats.biggestWin,
              icon: Crown,
              color: "text-amber-400",
              bg: "bg-transparent border-amber-500/20",
              glow: "hover:shadow-amber-500/20",
              action: () => router.push("/profile"),
            },
          ].map((stat, index) => (
            <Card
              key={index}
              onClick={stat.action}
              className={`${stat.bg} border backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer ${stat.glow} hover:shadow-xl`}
            >
              <CardContent className="p-6 text-center">
                <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                <div className={`text-2xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-slate-400 font-bold tracking-wider">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Game Modes Arena */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-6">CHOOSE YOUR BATTLEFIELD</h2>
          <p className="text-xl text-slate-300 font-medium">From lightning-fast duels to mind-bending mysteries</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {featuredGames.map((game, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${game.bgPattern} border-0 shadow-2xl transition-all duration-500 group ${game.glowColor} ${game.comingSoon ? 'cursor-not-allowed' : 'hover:shadow-3xl transform hover:scale-105 cursor-pointer'}`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-slate-900/90"></div>

              {/* Glow Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${game.gradient} opacity-0 transition-opacity duration-500 ${game.comingSoon ? '' : 'group-hover:opacity-20'}`}
              ></div>

              {/* Coming Soon Badge - Minimal */}
              {game.comingSoon && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-cyan-500/90 backdrop-blur-md rounded-full px-3 py-1 border border-cyan-400/50">
                    <div className="text-xs font-bold text-white">🚧 COMING SOON</div>
                  </div>
                </div>
              )}

              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${game.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <game.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <Badge className={`${game.comingSoon ? 'bg-slate-700/60 text-slate-300 border-slate-500/30' : 'bg-slate-800/60 text-emerald-400 border-emerald-500/30'} font-bold`}>
                      {game.comingSoon ? 'COMING SOON' : `${game.playersActive} ACTIVE`}
                    </Badge>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-sm font-bold text-slate-400 tracking-wider">{game.subtitle}</div>
                  <CardTitle className="text-3xl font-black text-white mb-2">{game.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <p className="text-slate-300 font-medium mb-6 text-lg">{game.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">PLAYERS</div>
                    <div className="font-black text-white">{game.players}</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">DURATION</div>
                    <div className="font-black text-white">{game.avgDuration}</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">DIFFICULTY</div>
                    <div className="font-black text-amber-400">{game.difficulty}</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">PRIZE RANGE</div>
                    <div className="font-black text-emerald-400">{game.prize}</div>
                  </div>
                </div>

                <Button
                  onClick={game.comingSoon ? undefined : () => handleCreateGame(game.id)}
                  disabled={game.comingSoon}
                  className={`w-full ${game.comingSoon ? 'bg-slate-700/80 text-slate-300 cursor-not-allowed border border-slate-500/50' : `bg-gradient-to-r ${game.gradient} hover:shadow-lg text-white`} font-black py-4 rounded-xl transition-all transform ${game.comingSoon ? '' : 'group-hover:scale-105'}`}
                >
                  {game.comingSoon ? (
                    <>
                      <div className="w-5 h-5 mr-2">🚧</div>
                      COMING SOON
                    </>
                  ) : (
                    <>
                  <Play className="w-5 h-5 mr-2" />
                  {isConnected ? "ENTER BATTLE" : "CONNECT TO PLAY"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={() => router.push("/browse")}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black text-xl px-12 py-4 rounded-xl shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all transform hover:scale-105"
          >
            VIEW ALL BATTLES
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </section>

      {/* Gaming Features */}
      <section className="relative z-10 bg-slate-900/40 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">REVOLUTIONARY GAMING</h2>
            <p className="text-xl text-slate-300 font-medium">Features that change everything</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "TRUE FAIRNESS",
                description: "Numbers generated only when all players join. No creator advantage, ever.",
                icon: Shield,
                gradient: "from-emerald-400 to-teal-600",
                glow: "hover:shadow-emerald-500/20",
                action: () => router.push("/create"),
              },
              {
                title: "COMPLETE STEALTH",
                description: "Hidden numbers stay invisible forever. Even blockchain explorers can't see them.",
                icon: Eye,
                gradient: "from-violet-400 to-purple-600",
                glow: "hover:shadow-violet-500/20",
                action: () => router.push("/browse"),
              },
              {
                title: "PURE SKILL",
                description: "Mathematical strategy games where brain power beats luck every time.",
                icon: Brain,
                gradient: "from-cyan-400 to-blue-600",
                glow: "hover:shadow-cyan-500/20",
                action: () => router.push("/ai"),
              },
            ].map((feature, index) => (
              <Card
                key={index}
                onClick={feature.action}
                className={`bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 transform hover:scale-105 cursor-pointer ${feature.glow} hover:shadow-xl`}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 font-medium">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/60 backdrop-blur-sm border-t border-slate-700/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black text-white">ZEROSUM</span>
              </div>
              <p className="text-slate-400 font-medium">Mathematical warfare where only the smartest survive.</p>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">GAME MODES</h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li
                  onClick={() => handleCreateGame("quick-draw")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Quick Draw
                </li>
                <li
                  onClick={() => handleCreateGame("strategic")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Strategic
                </li>
                <li
                  onClick={() => handleCreateGame("pure-mystery")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Pure Mystery
                </li>
                <li
                  onClick={() => handleCreateGame("hardcore-mystery")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Hardcore Mystery
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">ARENA</h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li
                  onClick={() => router.push("/tournaments")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Tournaments
                </li>
                <li
                  onClick={() => router.push("/spectate")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Spectator Betting
                </li>
                <li
                  onClick={() => router.push("/staking")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Staking Rewards
                </li>
                <li
                  onClick={() => router.push("/profile")}
                  className="hover:text-cyan-400 cursor-pointer transition-colors"
                >
                  Leaderboards
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-4">COMMUNITY</h4>
              <ul className="space-y-2 text-slate-400 font-medium">
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Discord</li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Twitter</li>
                <li onClick={() => router.push("/ai")} className="hover:text-cyan-400 cursor-pointer transition-colors">
                  Documentation
                </li>
                <li className="hover:text-cyan-400 cursor-pointer transition-colors">Support</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center">
            <p className="text-slate-400 font-medium">&copy; 2024 ZeroSum Gaming Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}