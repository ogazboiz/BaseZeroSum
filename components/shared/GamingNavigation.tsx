import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Gamepad2,
  Users,
  Coins,
  Zap,
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
  Target,
  Eye,
  Brain,
  Swords,
  Calendar,
  TrendingUp,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useAppKitAccount, useAppKit } from "@reown/appkit/react"
import { useDisconnect } from "@reown/appkit/react"
import { useWalletInfo } from "@reown/appkit/react"
import { useAccount, useDisconnect as useWagmiDisconnect, useConfig } from "wagmi"
import { toast } from "react-hot-toast"
import { ethers } from "ethers"
import { getEthersProvider } from "@/config/adapter" // Adjust path as needed

// ERC20 Token ABI (minimal for balanceOf and decimals)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
]

// Real ETH Balance Hook using ethers
const useETHBalance = (address: string | undefined) => {
  const config = useConfig()
  const [balance, setBalance] = useState<{
    formatted: string
    raw: bigint
    symbol: string
  }>({
    formatted: "0.0000",
    raw: 0n,
    symbol: "ETH"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = async () => {
    if (!address || !config) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = getEthersProvider(config)
      if (!provider) throw new Error("Provider not available")

      const rawBalance = await provider.getBalance(address)
      const formatted = parseFloat(ethers.formatEther(rawBalance)).toFixed(4)

      setBalance({
        formatted,
        raw: BigInt(rawBalance.toString()),
        symbol: "ETH"
      })
    } catch (err) {
      console.error("Error fetching ETH balance:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch balance"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, config])

  return {
    ...balance,
    isLoading,
    error,
    refetch: fetchBalance
  }
}

// Real Token Balance Hook for ZS or any ERC20 token using ethers
const useTokenBalance = (address: string | undefined, tokenAddress?: string) => {
  const config = useConfig()
  const [balance, setBalance] = useState<{
    formatted: string
    raw: bigint
    symbol: string
    decimals: number
  }>({
    formatted: "0",
    raw: 0n,
    symbol: "TOKEN",
    decimals: 18
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTokenBalance = async () => {
    if (!address || !tokenAddress || !config || tokenAddress === "0x...") return

    setIsLoading(true)
    setError(null)

    try {
      const provider = getEthersProvider(config)
      if (!provider) throw new Error("Provider not available")

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      
      // Fetch balance, decimals, and symbol in parallel
      const [rawBalance, decimals, symbol] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
      ])

      const formatted = parseFloat(ethers.formatUnits(rawBalance, decimals)).toFixed(0)

      setBalance({
        formatted,
        raw: BigInt(rawBalance.toString()),
        symbol,
        decimals
      })
    } catch (err) {
      console.error("Error fetching token balance:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch token balance"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTokenBalance()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTokenBalance, 30000)
    return () => clearInterval(interval)
  }, [address, tokenAddress, config])

  return {
    ...balance,
    isLoading,
    error,
    refetch: fetchTokenBalance
  }
}

// Mock player stats hook - replace with your actual stats hook
const usePlayerStats = (address: string | undefined) => ({
  wins: 24,
  losses: 8,
  rank: 47,
  totalEarnings: "12.5 ETH",
  winRate: 75,
  isLoading: false
})

export default function UnifiedGamingNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // AppKit hooks (same pattern as your home page)
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount()
  const { open, close } = useAppKit()
  const { walletInfo } = useWalletInfo()
  const { disconnect: appkitDisconnect } = useDisconnect()

  // Wagmi hooks (same pattern as your home page)
  const { address: wagmiAddress, isConnected: wagmiIsConnected, connector } = useAccount()
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect()

  // Unified state (exact same pattern as your home page)
  const address = appkitAddress || wagmiAddress
  const isConnected = appkitIsConnected || wagmiIsConnected
  
  // Real balance hooks
  const ethBalance = useETHBalance(address)
  
  // Replace with your actual ZS token contract address
  const ZS_TOKEN_ADDRESS = "0x..." // Add your ZS token contract address here
  const zsBalance = useTokenBalance(address, ZS_TOKEN_ADDRESS)
  
  const playerStats = usePlayerStats(address)

  useEffect(() => setMounted(true), [])

  // Show success toast when wallet connects
  useEffect(() => {
    if (mounted && isConnected) {
      toast.success("🎮 Wallet connected! Ready to battle!")
    }
  }, [mounted, isConnected])

  // Auto-refresh balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      ethBalance.refetch()
      zsBalance.refetch()
    }
  }, [isConnected, address])

  // Navigation items with their respective icons and paths
  const navigation = [
    { name: "ARENA", href: "/",  },
    { name: "CREATE", href: "/create",},
    { name: "BATTLES", href: "/browse" },
    { name: "SPECTATE", href: "/spectate" },
    { name: "TOURNAMENTS", href: "/tournaments"},
  ]

  // Get page-specific button text and action
  const getPageAction = () => {
    switch (pathname) {
      case "/":
        return { text: "CREATE BATTLE", action: () => router.push("/create"), icon: Flame }
      case "/create":
        return { text: "VIEW BATTLES", action: () => router.push("/browse"), icon: Eye }
      case "/browse":
        return { text: "CREATE GAME", action: () => router.push("/create"), icon: Plus }
      case "/spectate":
        return { text: "JOIN BATTLE", action: () => router.push("/browse"), icon: Swords }
      case "/tournaments":
        return { text: "CREATE TOURNAMENT", action: () => router.push("/tournaments/create"), icon: Trophy }
      case "/profile":
        return { text: "ENTER ARENA", action: () => router.push("/browse"), icon: Target }
      case "/staking":
        return { text: "VIEW REWARDS", action: () => router.push("/profile"), icon: Crown }
      default:
        return { text: "ENTER ARENA", action: () => router.push("/"), icon: Gamepad2 }
    }
  }

  const pageAction = getPageAction()

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

    if (walletInfo?.icon) {
      const sanitizedUrl = sanitizeImageUrl(walletInfo.icon)
      if (sanitizedUrl) {
        return (
          <Image
            src={sanitizedUrl}
            alt={walletInfo.name || "Wallet"}
            width={20}
            height={20}
            className="w-4 h-4 rounded-full sm:w-5 sm:h-5"
            onError={(e) => {
              (e.currentTarget.style.display = "none")
              console.warn('Failed to load wallet icon:', sanitizedUrl)
            }}
            unoptimized
          />
        )
      }
    }

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

  const getWalletName = () => walletInfo?.name || connector?.name || "Battle Wallet"

  const handleConnect = async () => {
    try {
      await open()
    } catch (error: unknown) {
      console.error("Connection error:", error instanceof Error ? error.message : String(error))
      toast.error("Failed to connect wallet. Please try again.")
    }
  }

  const handleDisconnect = () => {
    console.log("Disconnect initiated")
    setIsDropdownOpen(false)
    try {
      if (appkitIsConnected) {
        console.log("Disconnecting AppKit")
        appkitDisconnect()
      }
      if (wagmiIsConnected) {
        console.log("Disconnecting Wagmi")
        wagmiDisconnect()
      }
      close()
      toast.success("Wallet disconnected")
    } catch (error: unknown) {
      console.error("Disconnect error:", error instanceof Error ? error.message : String(error))
    }
  }

  // Refresh balances manually
  const handleRefreshBalances = () => {
    ethBalance.refetch()
    zsBalance.refetch()
    toast.success("Balances refreshed!")
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

  const handleActionClick = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!")
      return
    }
    pageAction.action()
  }

  return (
    <nav className="relative z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                ZEROSUM
              </span>
              <div className="text-xs text-slate-400 font-medium">GAMING ARENA</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 font-bold transition-colors hover:text-cyan-400 ${
                  pathname === item.href
                    ? "text-cyan-400 border-b-2 border-cyan-400 pb-1"
                    : "text-slate-300"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {!mounted ? (
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25">
                <Wallet className="w-4 h-4 mr-2" />
                CONNECT
              </Button>
            ) : isConnected ? (
              <>
                {/* Balance Display - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  {/* ETH Balance with loading state */}
                  <Badge className="bg-slate-800/60 backdrop-blur-sm border border-emerald-500/30 rounded-xl px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-400">
                        {ethBalance.isLoading ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          `${ethBalance.formatted} ${ethBalance.symbol}`
                        )}
                      </span>
                      {ethBalance.error && (
                        <span className="text-red-400 text-xs">!</span>
                      )}
                    </div>
                  </Badge>

                  {/* ZS Token Balance - only show if token address is set */}
                  {ZS_TOKEN_ADDRESS && ZS_TOKEN_ADDRESS !== "0x..." && (
                    <Badge className="bg-slate-800/60 backdrop-blur-sm border border-violet-500/30 rounded-xl px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                        <Zap className="w-4 h-4 text-violet-400" />
                        <span className="font-bold text-violet-400">
                          {zsBalance.isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            `${zsBalance.formatted} ${zsBalance.symbol}`
                          )}
                        </span>
                        {zsBalance.error && (
                          <span className="text-red-400 text-xs">!</span>
                        )}
                      </div>
                    </Badge>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-10 h-10 text-slate-400 hover:text-cyan-400 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <User className="w-5 h-5" />
                  </Button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 z-50 w-80 mt-2 border border-slate-700/50 rounded-xl shadow-2xl bg-slate-900/95 backdrop-blur-sm">
                      {/* Header */}
                      <div className="p-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3 mb-4">
                          <Wallet className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white">Battle Wallet</p>
                            <p className="text-sm text-slate-400">{truncateAddress(address)}</p>
                          </div>
                          <Crown className="w-5 h-5 text-amber-400" />
                        </div>
                        
                        {/* Player Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-2 rounded-lg bg-slate-800/60">
                            <div className="text-lg font-bold text-emerald-400">{playerStats.wins}</div>
                            <div className="text-xs text-slate-400">WINS</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-800/60">
                            <div className="text-lg font-bold text-red-400">{playerStats.losses}</div>
                            <div className="text-xs text-slate-400">LOSSES</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-800/60">
                            <div className="text-lg font-bold text-violet-400">#{playerStats.rank}</div>
                            <div className="text-xs text-slate-400">RANK</div>
                          </div>
                        </div>
                      </div>

                      {/* Balance Details */}
                      <div className="p-4 border-b border-slate-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-300">Wallet Balances</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRefreshBalances}
                            className="h-6 px-2 text-xs text-slate-400 hover:text-cyan-400"
                          >
                            Refresh
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-slate-800/40">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium text-emerald-300">
                                  {ethBalance.symbol} Balance
                                </span>
                              </div>
                              <div className="text-right">
                                {ethBalance.isLoading ? (
                                  <span className="text-sm text-slate-400 animate-pulse">Loading...</span>
                                ) : ethBalance.error ? (
                                  <span className="text-sm text-red-400">Error</span>
                                ) : (
                                  <span className="text-sm font-bold text-emerald-400">
                                    {ethBalance.formatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* ZS Token Balance - only show if configured */}
                          {ZS_TOKEN_ADDRESS && ZS_TOKEN_ADDRESS !== "0x..." && (
                            <div className="p-3 rounded-lg bg-slate-800/40">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-violet-400" />
                                  <span className="text-sm font-medium text-violet-300">
                                    {zsBalance.symbol} Tokens
                                  </span>
                                </div>
                                <div className="text-right">
                                  {zsBalance.isLoading ? (
                                    <span className="text-sm text-slate-400 animate-pulse">Loading...</span>
                                  ) : zsBalance.error ? (
                                    <span className="text-sm text-red-400">Error</span>
                                  ) : (
                                    <span className="text-sm font-bold text-violet-400">
                                      {zsBalance.formatted}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="p-3 rounded-lg bg-slate-800/40">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-amber-300">Total Earnings</span>
                              </div>
                              <span className="text-sm font-bold text-amber-400">
                                {playerStats.totalEarnings}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                        >
                          <User className="w-4 h-4" />
                          Battle Profile
                        </Link>
                        <Link
                          href="/staking"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Staking & Rewards
                        </Link>
                        <button className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white">
                          <Settings className="w-4 h-4" />
                          Game Settings
                        </button>
                        <button
                          onClick={handleDisconnect}
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-400 transition-colors rounded-lg hover:bg-red-500/10 hover:text-red-300"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page-Specific Action Button */}
                <Button
                  onClick={handleActionClick}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
                >
                  <pageAction.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{pageAction.text}</span>
                  <span className="sm:hidden">{pageAction.text.split(' ')[0]}</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnect}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                <Wallet className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">CONNECT WALLET</span>
                <span className="sm:hidden">CONNECT</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-10 h-10 text-slate-400 bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-menu-toggle="true"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden pt-4 pb-4 mx-2 mt-4 border-t border-slate-700/50 rounded-lg bg-slate-800/50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                    pathname === item.href
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Balance Display */}
              {isConnected && (
                <div className="pt-4 mt-4 border-t border-slate-700/50">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-800/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-300">
                            {ethBalance.symbol}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">
                          {ethBalance.isLoading ? "..." : ethBalance.formatted}
                        </span>
                      </div>
                    </div>
                    
                    {/* ZS Token for mobile - only show if configured */}
                    {ZS_TOKEN_ADDRESS && ZS_TOKEN_ADDRESS !== "0x..." && (
                      <div className="p-3 rounded-lg bg-slate-800/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-violet-300">
                              {zsBalance.symbol}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-violet-400">
                            {zsBalance.isLoading ? "..." : zsBalance.formatted}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Mobile Stats */}
                    <div className="p-3 rounded-lg bg-slate-800/60">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-bold text-emerald-400">{playerStats.wins}</div>
                          <div className="text-xs text-slate-400">WINS</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-red-400">{playerStats.losses}</div>
                          <div className="text-xs text-slate-400">LOSSES</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-violet-400">#{playerStats.rank}</div>
                          <div className="text-xs text-slate-400">RANK</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}