"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Gamepad2,
  Bot,
  Brain,
  Sparkles,
  Target,
  Eye,
  Users,
  Star,
  Calendar,
  Coins,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Shield,
} from "lucide-react"
import Link from "next/link"

export default function AIIntegrationPage() {
  const aiPersonalities = [
    {
      name: "Calculus Cat",
      skill: 90,
      specialty: "Mathematical genius who calculates optimal moves",
      avatar: "🐱",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      status: "Coming Soon",
    },
    {
      name: "Random Rick",
      skill: 30,
      specialty: "Chaotic player who makes wild, unpredictable moves",
      avatar: "🎲",
      color: "bg-red-100 text-red-700 border-red-200",
      status: "Coming Soon",
    },
    {
      name: "Steady Steve",
      skill: 60,
      specialty: "Conservative player with consistent, safe strategy",
      avatar: "🛡️",
      color: "bg-green-100 text-green-700 border-green-200",
      status: "Coming Soon",
    },
    {
      name: "Perfect Petra",
      skill: 95,
      specialty: "Near-perfect AI that almost never makes mistakes",
      avatar: "👑",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      status: "Coming Soon",
    },
    {
      name: "Risky Rita",
      skill: 45,
      specialty: "High-risk, high-reward gambler who goes for big plays",
      avatar: "🎯",
      color: "bg-orange-100 text-orange-700 border-orange-200",
      status: "Coming Soon",
    },
    {
      name: "Adaptive Alex",
      skill: 75,
      specialty: "AI that adapts strategy based on opponent behavior",
      avatar: "🔄",
      color: "bg-teal-100 text-teal-700 border-teal-200",
      status: "Coming Soon",
    },
  ]

  const aiFeatures = [
    {
      title: "AI Opponents",
      description: "Play against 8 unique AI personalities with different skill levels and strategies",
      icon: Bot,
      color: "bg-blue-100 text-blue-700",
      features: ["Multiple difficulty levels", "Unique playing styles", "True Mystery support", "Pattern recognition"],
    },
    {
      title: "AI Advisory",
      description: "Get strategic advice and move suggestions from AI during your games",
      icon: Lightbulb,
      color: "bg-yellow-100 text-yellow-700",
      features: ["Real-time suggestions", "Move analysis", "Pattern insights", "Risk assessment"],
    },
    {
      title: "AI Analytics",
      description: "Detailed analysis of your playing patterns and improvement recommendations",
      icon: TrendingUp,
      color: "bg-green-100 text-green-700",
      features: ["Performance tracking", "Weakness identification", "Skill progression", "Personalized tips"],
    },
    {
      title: "AI Tournaments",
      description: "Special tournaments featuring AI opponents and mixed human-AI competitions",
      icon: Star,
      color: "bg-purple-100 text-purple-700",
      features: ["AI-only brackets", "Mixed competitions", "Special rewards", "Leaderboards"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                ZeroSum
              </span>
            </Link>

            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <Coins className="w-3 h-3 mr-1" />
                2.45 ETH
              </Badge>
              <Button variant="outline" className="rounded-xl bg-transparent">
                Back to Games
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              AI Integration
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Experience the future of gaming with AI-powered opponents, strategic advice, and advanced analytics
          </p>

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-800">Coming Soon!</span>
            </div>
            <p className="text-purple-700">
              Our AI system is in final development. Get ready for revolutionary gaming experiences with intelligent
              opponents and personalized coaching.
            </p>
          </div>
        </div>

        {/* AI Features Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {aiFeatures.map((feature, index) => (
            <Card
              key={index}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
            >
              <CardHeader className="pb-4">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Personalities */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Meet the AI Personalities</h2>
            <p className="text-xl text-gray-600">8 unique AI opponents with distinct playing styles and skill levels</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiPersonalities.map((ai, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{ai.avatar}</div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">{ai.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Skill: {ai.skill}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">{ai.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{ai.specialty}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Skill Level</span>
                      <span className="font-medium">{ai.skill}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ai.skill}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-purple-600" />
                True Mystery AI Challenge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Our AI opponents face the same challenges as human players in True Mystery modes - they can't see the
                hidden numbers either!
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700">AI must work with zero number visibility</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Pattern recognition from move history</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Careful calculation to avoid instant loss</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
                AI Advisory System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Get real-time strategic advice from multiple AI personalities during your games.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Move suggestions with reasoning</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-700">Risk assessment and probability analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg">
                  <Users className="w-5 h-5 text-teal-600" />
                  <span className="text-sm text-gray-700">Multiple AI opinions for comparison</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              AI Development Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Phase 1: Core AI System</h3>
                  <p className="text-gray-600 text-sm">Deploy basic AI opponents with True Mystery support</p>
                  <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">Next 2-4 weeks</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Phase 2: AI Advisory</h3>
                  <p className="text-gray-600 text-sm">Launch real-time strategic advice system</p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 mt-2">1-2 months</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Phase 3: Advanced Analytics</h3>
                  <p className="text-gray-600 text-sm">Deploy comprehensive player analysis and insights</p>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 mt-2">2-3 months</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready for the AI Revolution?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Be among the first to experience AI-powered gaming when we launch
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Play Current Games
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl px-8 py-3 bg-transparent"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Get Notified
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
