"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Gamepad2,
  Target,
  Brain,
  Users,
  Coins,
  Swords,
  Clock,
  Copy,
  Share2,
  Eye,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

export default function WaitingRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const battleId = params.id
  const mode = searchParams.get("mode") || "quick-draw"

  // Game mode configurations
  const gameModeConfigs = {
    "quick-draw": {
      title: "Quick Draw",
      icon: Target,
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      bgGradient: "from-emerald-900/20 to-teal-900/20",
      rules: "Subtract exactly 1 each turn - reach 0 to WIN!",
      difficulty: "★★☆☆☆",
      avgDuration: "2-5 min",
    },
    strategic: {
      title: "Strategic",
      icon: Brain,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-900/20 to-indigo-900/20",
      rules: "Subtract 10-30% each turn - force opponent to hit 0!",
      difficulty: "★★★★☆",
      avgDuration: "5-15 min",
    },
  }

  const config = gameModeConfigs[mode] || gameModeConfigs["quick-draw"]

  // Battle state
  const [battle, setBattle] = useState({
    id: battleId,
    mode: config.title,
    creator: "You",
    entryFee: searchParams.get("entryFee") || "0.1",
    prizePool: "0.19", // This will be calculated
    status: "waiting", // waiting, active, completed
    timeCreated: new Date().toLocaleTimeString(),
    icon: config.icon,
    gradient: config.gradient,
    bgGradient: config.bgGradient,
    rules: config.rules,
    difficulty: config.difficulty,
    avgDuration: config.avgDuration,
  })

  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    // Set the share URL
    setShareUrl(`${window.location.origin}/battle/join/${battleId}?mode=${mode}`)
    
    // Calculate prize pool (entry fee * 2 - platform fee)
    const entryFee = parseFloat(battle.entryFee)
    const prizePool = (entryFee * 2 * 0.95).toFixed(3) // 5% platform fee
    setBattle(prev => ({ ...prev, prizePool }))
  }, [battleId, mode, battle.entryFee])

  // Check if opponent has joined (simulate polling)
  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true)
      // In a real app, this would check the blockchain for game status
      // For now, we'll simulate it
      setTimeout(() => {
        setIsCheckingStatus(false)
      }, 2000)
    }

    const interval = setInterval(checkStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Battle link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const handleShareBattle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my ${battle.mode} battle!`,
          text: `I've created a ${battle.mode} battle with ${battle.entryFee} ETH entry fee. Join me!`,
          url: shareUrl,
        })
      } catch (err) {
        toast.error("Failed to share battle")
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCancelBattle = () => {
    // In a real app, this would cancel the game on the blockchain
    toast.success("Battle cancelled")
    router.push("/browse")
  }

  const handleViewBattle = () => {
    router.push(`/battle/${battleId}?mode=${mode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                  ZEROSUM
                </span>
                <div className="text-xs text-slate-400 font-medium">WAITING ROOM</div>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/60 backdrop-blur-sm border border-amber-500/30 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400">WAITING</span>
                </div>
              </div>
              <Button
                onClick={handleCancelBattle}
                variant="outline"
                className="border-rose-600 text-rose-400 hover:bg-rose-600/10 rounded-xl font-bold bg-transparent"
              >
                CANCEL BATTLE
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Battle Header */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${battle.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                    >
                      <battle.icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-4xl font-black text-white">{battle.mode}</CardTitle>
                      <p className="text-slate-300 font-medium">Battle #{battle.id}</p>
                      <p className="text-slate-400 text-sm">Created at {battle.timeCreated}</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-lg px-4 py-2">
                    WAITING FOR OPPONENT
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Battle Info */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                  BATTLE DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Coins className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-300 font-medium">Entry Fee</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{battle.entryFee} ETH</div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Coins className="w-5 h-5 text-cyan-400" />
                      <span className="text-slate-300 font-medium">Prize Pool</span>
                    </div>
                    <div className="text-2xl font-black text-cyan-400">{battle.prizePool} ETH</div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="w-5 h-5 text-violet-400" />
                      <span className="text-slate-300 font-medium">Players</span>
                    </div>
                    <div className="text-2xl font-black text-violet-400">1/2</div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span className="text-slate-300 font-medium">Duration</span>
                    </div>
                    <div className="text-2xl font-black text-amber-400">{battle.avgDuration}</div>
                  </div>
                </div>

                {/* Battle Rules */}
                <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-600/50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-cyan-400" />
                    Battle Rules
                  </h4>
                  <p className="text-slate-300 mb-3">{battle.rules}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-slate-400">Difficulty: <span className="text-amber-400 font-bold">{battle.difficulty}</span></span>
                    <span className="text-slate-400">Created by: <span className="text-emerald-400 font-bold">{battle.creator}</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Battle */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-white flex items-center">
                  <Share2 className="w-6 h-6 mr-3 text-emerald-400" />
                  INVITE OPPONENT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  Share this battle link with friends or post it on social media to find an opponent!
                </p>
                
                <div className="flex space-x-3">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={handleShareBattle}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-amber-400" />
                  BATTLE STATUS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    {isCheckingStatus ? (
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    ) : (
                      <Clock className="w-8 h-8 text-amber-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Waiting for Opponent</h3>
                  <p className="text-slate-400 text-sm">
                    {isCheckingStatus ? "Checking for new players..." : "Share the battle link to find an opponent"}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creator:</span>
                    <span className="text-emerald-400 font-bold">You</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opponent:</span>
                    <span className="text-amber-400 font-bold">Waiting...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-amber-400 font-bold">Open</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleViewBattle}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Battle
                </Button>
                
                <Button
                  onClick={() => router.push("/browse")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Swords className="w-4 h-4 mr-2" />
                  Browse Battles
                </Button>
                
                <Button
                  onClick={() => router.push("/create")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-black text-white">💡 TIPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>• Share your battle link on Discord, Twitter, or gaming communities</p>
                <p>• The battle will start automatically when an opponent joins</p>
                <p>• You can cancel the battle anytime before it starts</p>
                <p>• Entry fee is locked until the battle begins</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
