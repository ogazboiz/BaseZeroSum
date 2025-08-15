// components/DebugPanel.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  ChevronUp, 
  Bug, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from "lucide-react"

interface DebugPanelProps {
  debugInfo: any
  userAddress?: string
}

export function DebugPanel({ debugInfo, userAddress }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'games' | 'contract' | 'errors'>('overview')

  if (!debugInfo || Object.keys(debugInfo).length === 0) {
    return null
  }

  const hasErrors = debugInfo.errors && debugInfo.errors.length > 0
  const hasUserGames = debugInfo.userGames && debugInfo.userGames.length > 0

  return (
    <Card className="mt-8 bg-slate-800/60 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-white">Debug Information</CardTitle>
            {hasErrors && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {debugInfo.errors.length} Error{debugInfo.errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {hasUserGames && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                {debugInfo.userGames.length} Game{debugInfo.userGames.length > 1 ? 's' : ''} Found
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 border-b border-slate-700/50">
            {['overview', 'games', 'contract', 'errors'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  selectedTab === tab
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab}
                {tab === 'errors' && hasErrors && (
                  <span className="ml-1 text-xs bg-red-500/20 text-red-400 px-1 rounded">
                    {debugInfo.errors.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400">User Address</div>
                  <div className="text-xs text-white font-mono break-all">
                    {debugInfo.userAddress || 'Not set'}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400">Game Counter</div>
                  <div className="text-lg font-bold text-white">
                    {debugInfo.gameCounter || 0}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400">Games Checked</div>
                  <div className="text-lg font-bold text-white">
                    {debugInfo.gamesChecked?.length || 0}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400">User Games Found</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {debugInfo.userGames?.length || 0}
                  </div>
                </div>
              </div>

              {debugInfo.message && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-blue-400">{debugInfo.message}</div>
                </div>
              )}
            </div>
          )}

          {/* Games Tab */}
          {selectedTab === 'games' && (
            <div className="space-y-4">
              {debugInfo.gamesChecked && debugInfo.gamesChecked.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.gamesChecked.map((game: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        game.isUserGame
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-700/50 border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-white">Game #{game.gameId}</span>
                          {game.isUserGame ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="flex space-x-2 text-xs">
                          <Badge variant={game.gameExists ? "default" : "secondary"}>
                            {game.gameExists ? "Exists" : "No Data"}
                          </Badge>
                          <Badge variant={game.hasPlayers ? "default" : "secondary"}>
                            {game.hasPlayers ? "Has Players" : "No Players"}
                          </Badge>
                          <Badge variant={game.processed ? "default" : "secondary"}>
                            {game.processed ? "Processed" : "Skipped"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No games data available
                </div>
              )}
            </div>
          )}

          {/* Contract Tab */}
          {selectedTab === 'contract' && (
            <div className="space-y-4">
              {debugInfo.contractResponses ? (
                <div className="space-y-4">
                  {Object.entries(debugInfo.contractResponses).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="text-sm font-medium text-white mb-2">{key}</div>
                      <pre className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No contract response data available
                </div>
              )}
            </div>
          )}

          {/* Errors Tab */}
          {selectedTab === 'errors' && (
            <div className="space-y-4">
              {debugInfo.errors && debugInfo.errors.length > 0 ? (
                <div className="space-y-3">
                  {debugInfo.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          {error.gameId !== undefined && (
                            <div className="text-sm font-medium text-red-400 mb-1">
                              Game #{error.gameId}
                            </div>
                          )}
                          {error.general && (
                            <div className="text-sm font-medium text-red-400 mb-1">
                              General Error
                            </div>
                          )}
                          <div className="text-sm text-red-300">{error.error}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-emerald-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  No errors found!
                </div>
              )}
            </div>
          )}

          {/* Raw Debug Data */}
          <details className="mt-6">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white">
              Raw Debug Data (Click to expand)
            </summary>
            <pre className="mt-2 text-xs text-slate-300 bg-slate-800/50 p-4 rounded overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      )}
    </Card>
  )
}