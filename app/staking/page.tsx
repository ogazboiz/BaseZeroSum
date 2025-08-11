"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Gamepad2, Coins, TrendingUp, Shield, Zap, Crown, Star, ArrowLeft, Bot, Plus, Gift, Minus } from "lucide-react"
import Link from "next/link"

import UnifiedGamingNavigation from "@/components/shared/GamingNavigation"

export default function StakingPage() {
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")

  const stakingStats = {
    totalStaked: "1.5",
    currentAPY: "10",
    pendingRewards: "0.0342",
    multiplier: "1.25x",
    nextTier: "5.0",
    nextMultiplier: "1.5x",
  }

  const stakingTiers = [
    {
      amount: "0.1+",
      multiplier: "1.1x",
      color: "bg-green-100 text-green-700 border-green-200",
      icon: Shield,
      benefits: ["10% bonus on winnings", "Basic staking rewards"],
    },
    {
      amount: "1.0+",
      multiplier: "1.25x",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Crown,
      benefits: ["25% bonus on winnings", "Enhanced staking rewards", "Priority matchmaking"],
    },
    {
      amount: "5.0+",
      multiplier: "1.5x",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: Zap,
      benefits: ["50% bonus on winnings", "Maximum staking rewards", "VIP tournament access", "AI advisory priority"],
    },
  ]

  const recentActivity = [
    {
      type: "stake",
      amount: "0.5 ETH",
      date: "2 hours ago",
      status: "Confirmed",
    },
    {
      type: "reward",
      amount: "0.0123 ETH",
      date: "1 day ago",
      status: "Claimed",
    },
    {
      type: "bonus",
      amount: "0.025 ETH",
      date: "3 days ago",
      status: "Applied",
    },
  ]

  return (
   
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
        {/* Navigation */}
         <UnifiedGamingNavigation />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">ETH Staking</h1>
            <p className="text-xl text-gray-600">Stake ETH to earn rewards and unlock gaming bonuses</p>
          </div>

          {/* AI Staking Optimization Coming Soon */}
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bot className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-purple-800">AI Staking Optimization</h3>
                    <p className="text-purple-700 text-sm">
                      Get AI-powered recommendations for optimal staking strategies and reward maximization
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-200 text-purple-800 border-purple-300">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Staking Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Staking Status */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 flex items-center">
                    <Coins className="w-6 h-6 mr-2 text-yellow-600" />
                    Your Staking Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stakingStats.totalStaked}</div>
                      <div className="text-sm text-gray-600">ETH Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{stakingStats.currentAPY}%</div>
                      <div className="text-sm text-gray-600">Current APY</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{stakingStats.pendingRewards}</div>
                      <div className="text-sm text-gray-600">Pending Rewards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{stakingStats.multiplier}</div>
                      <div className="text-sm text-gray-600">Win Multiplier</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress to next tier</span>
                      <span className="text-sm text-gray-600">
                        {stakingStats.totalStaked} / {stakingStats.nextTier} ETH
                      </span>
                    </div>
                    <Progress
                      value={
                        (Number.parseFloat(stakingStats.totalStaked) / Number.parseFloat(stakingStats.nextTier)) * 100
                      }
                      className="h-3 mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      Stake{" "}
                      {(Number.parseFloat(stakingStats.nextTier) - Number.parseFloat(stakingStats.totalStaked)).toFixed(
                        1,
                      )}{" "}
                      more ETH to unlock {stakingStats.nextMultiplier} multiplier
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Staking Tiers */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Staking Tiers & Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stakingTiers.map((tier, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 ${
                          Number.parseFloat(stakingStats.totalStaked) >= Number.parseFloat(tier.amount.replace("+", ""))
                            ? tier.color + " shadow-lg"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tier.color}`}>
                            <tier.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-800">{tier.amount} ETH</h3>
                              <Badge className={tier.color}>{tier.multiplier}</Badge>
                              {Number.parseFloat(stakingStats.totalStaked) >=
                                Number.parseFloat(tier.amount.replace("+", "")) && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                              )}
                            </div>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {tier.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activity.type === "stake"
                                ? "bg-blue-100 text-blue-600"
                                : activity.type === "reward"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            {activity.type === "stake" ? (
                              <Plus className="w-4 h-4" />
                            ) : activity.type === "reward" ? (
                              <Gift className="w-4 h-4" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{activity.type}</p>
                            <p className="text-sm text-gray-600">{activity.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{activity.amount}</p>
                          <p className="text-sm text-green-600">{activity.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Staking Actions */}
            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-8">
                {/* Stake ETH */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Stake ETH</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Amount to Stake</label>
                      <Input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.1"
                        className="rounded-xl"
                        step="0.01"
                        min="0.01"
                      />
                    </div>

                    {stakeAmount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Stake Amount:</span>
                          <span className="font-medium">{stakeAmount} ETH</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Annual Rewards:</span>
                          <span className="font-bold text-green-600">
                            {(Number.parseFloat(stakeAmount) * 0.1).toFixed(4)} ETH
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>New Multiplier:</span>
                          <span className="font-bold text-purple-600">
                            {Number.parseFloat(stakeAmount) + Number.parseFloat(stakingStats.totalStaked) >= 5
                              ? "1.5x"
                              : Number.parseFloat(stakeAmount) + Number.parseFloat(stakingStats.totalStaked) >= 1
                                ? "1.25x"
                                : Number.parseFloat(stakeAmount) + Number.parseFloat(stakingStats.totalStaked) >= 0.1
                                  ? "1.1x"
                                  : "1.0x"}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-3"
                      disabled={!stakeAmount}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Stake ETH
                    </Button>
                  </CardContent>
                </Card>

                {/* Claim Rewards */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Claim Rewards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{stakingStats.pendingRewards}</div>
                      <div className="text-sm text-gray-600">ETH Available</div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl py-3"
                      disabled={Number.parseFloat(stakingStats.pendingRewards) === 0}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Claim Rewards
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Rewards are calculated daily and can be claimed anytime
                    </p>
                  </CardContent>
                </Card>

                {/* Unstake ETH */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Unstake ETH</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Amount to Unstake</label>
                      <Input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="0.1"
                        className="rounded-xl"
                        step="0.01"
                        min="0.01"
                        max={stakingStats.totalStaked}
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl py-3 bg-transparent"
                      disabled={!unstakeAmount}
                    >
                      <Minus className="w-5 h-5 mr-2" />
                      Unstake ETH
                    </Button>

                    <p className="text-xs text-gray-500 text-center">Instant unstaking available • No lock-up period</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
   
  )
}
