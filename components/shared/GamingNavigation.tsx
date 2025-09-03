import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Gamepad2,
  Coins,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Swords,
  Eye,
  Trophy
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAppKitAccount, useAppKit } from "@reown/appkit/react"
import { useDisconnect } from "@reown/appkit/react"
import { useAccount, useDisconnect as useWagmiDisconnect, useConfig } from "wagmi"
import { EnhancedConnectButton } from "@/components/auth/EnhancedConnectButton"
import { toast } from "react-hot-toast"
import { ethers } from "ethers"
import { getEthersProvider } from "@/config/adapter"
import MyGamesDropdown from "./MyGamesDropdown"

// Simple MNT Balance Hook
function useMNTBalance(address: string | undefined) {
  const config = useConfig()
  const [balance, setBalance] = useState<string>("0.0000")
  const [isLoading, setIsLoading] = useState(false)
  
  // Store provider in ref to avoid repeated getEthersProvider calls
  const providerRef = useRef<any>(null)

  const fetchBalance = async () => {
    if (!address || !config) return

    setIsLoading(true)
    try {
      // Use stored provider or get new one
      if (!providerRef.current) {
        providerRef.current = getEthersProvider(config)
      }
      const provider = providerRef.current
      if (!provider) throw new Error("Provider not available")

      const rawBalance = await provider.getBalance(address)
      const formatted = parseFloat(ethers.formatEther(rawBalance)).toFixed(4)
      setBalance(formatted)
    } catch (err) {
      console.error("Error fetching MNT balance:", err)
      setBalance("0.0000")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, config])

  return { balance, isLoading, refetch: fetchBalance }
}

export default function UnifiedGamingNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount()
  const { open, close } = useAppKit()
  const { disconnect: appkitDisconnect } = useDisconnect()

  // Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount()
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect()

  // Unified state
  const address = appkitAddress || wagmiAddress
  const isConnected = appkitIsConnected || wagmiIsConnected
  
  // Simple balance hook
  const mntBalance = useMNTBalance(address)

  useEffect(() => setMounted(true), [])

  // Show success toast when wallet connects
  useEffect(() => {
    if (mounted && isConnected) {
      toast.success("🎮 Wallet connected! Ready to battle!")
    }
  }, [mounted, isConnected])

  // Essential navigation - only the core items
  const navigation = [
    { name: "HOME", href: "/", icon: Gamepad2 },
    { name: "BROWSE", href: "/browse", icon: Eye },
    { name: "CREATE", href: "/create", icon: Plus },
    { name: "TOURNAMENTS", href: "/tournaments", icon: Trophy },
  ]

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ""

  const handleConnect = async () => {
    try {
      await open()
    } catch (error: unknown) {
      console.error("Connection error:", error instanceof Error ? error.message : String(error))
      toast.error("Failed to connect wallet. Please try again.")
    }
  }

  const handleDisconnect = () => {
    setIsDropdownOpen(false)
    try {
      if (appkitIsConnected) {
        appkitDisconnect()
      }
      if (wagmiIsConnected) {
        wagmiDisconnect()
      }
      close()
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

  return (
    <nav className="relative z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="relative">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Gamepad2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                ZEROSUM
              </span>
              <div className="text-xs text-slate-400 font-medium">GAMING</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  pathname === item.href
                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                    : "text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {!mounted ? (
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl px-3 py-2 h-9 text-sm md:px-6 md:py-3 md:h-12 md:text-base">
                <Wallet className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden sm:inline">CONNECT</span>
                <span className="sm:hidden">CONNECT</span>
              </Button>
            ) : (
              <EnhancedConnectButton className="flex-shrink-0" />
            )}
            
            {isConnected && (
              <>
                {/* MNT Balance - Desktop */}
                <div className="hidden md:flex">
                  <Badge className="bg-slate-800/60 border border-emerald-500/30 rounded-lg px-3 py-1">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">
                        {mntBalance.isLoading ? "..." : `${mntBalance.balance} MNT`}
                      </span>
                    </div>
                  </Badge>
                </div>

                {/* My Games Dropdown */}
                {/* <MyGamesDropdown /> */}

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-9 h-9 text-slate-400 hover:text-cyan-400 bg-slate-800/60 border border-slate-700/50 rounded-lg"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <User className="w-4 h-4" />
                  </Button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 z-50 w-64 mt-2 border border-slate-700/50 rounded-xl shadow-2xl bg-slate-900/95 backdrop-blur-sm">
                      {/* Wallet Info */}
                      <div className="p-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Connected Wallet</p>
                            <p className="text-xs text-slate-400">{truncateAddress(address)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/my-games"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Swords className="w-4 h-4" />
                          My Games
                        </Link>
                        <Link
                          href="/my-bets"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Coins className="w-4 h-4" />
                          My Bets
                        </Link>
                        <Link
                          href="/leaderboard"
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-300 transition-colors rounded-lg hover:bg-slate-800/60 hover:text-white"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Trophy className="w-4 h-4" />
                          Leaderboard
                        </Link>
                        <button
                          onClick={handleDisconnect}
                          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-400 transition-colors rounded-lg hover:bg-red-500/10 hover:text-red-300"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-8 h-8 text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-menu-toggle="true"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden pt-4 pb-4 mx-2 mt-2 border-t border-slate-700/50 rounded-lg bg-slate-800/50 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Balance Display */}
              {isConnected && (
                <div className="pt-4 mt-4 border-t border-slate-700/50">
                  <div className="p-3 rounded-lg bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-300">MNT Balance</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">
                        {mntBalance.isLoading ? "..." : `${mntBalance.balance} MNT`}
                      </span>
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