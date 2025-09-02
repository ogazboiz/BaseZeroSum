'use client'


import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Crown, Users, Calendar, DollarSign, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useUnifiedGameData } from '@/hooks/useUnifiedGameContracts'
import { TournamentStatus, UnifiedGameMode, getModeName, getModeIcon } from '@/hooks/useUnifiedGameContracts'
import { ethers } from 'ethers'

interface TournamentResults {
  id: number
  name: string
  mode: UnifiedGameMode
  entryFee: string
  prizePool: string
  maxParticipants: number
  currentParticipants: number
  status: TournamentStatus
  winner: string
  participants: string[]
  rounds: Array<{
    round: number
    matches: Array<{
      index: number
      player1: string
      player2: string
      winner: string
      done: boolean
    }>
  }>
}

export default function TournamentResultsPage() {
  const params = useParams()
  const tournamentId = Number(params.id)
  
  const [tournament, setTournament] = useState<TournamentResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { getTournamentBracket } = useUnifiedGameData()

  useEffect(() => {
    loadTournamentResults()
  }, [tournamentId])

  const loadTournamentResults = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading tournament results for ID:', tournamentId)
      
      // Use the hook's direct method - much faster!
      const bracket = await getTournamentBracket(tournamentId)
      console.log('✅ Bracket data loaded:', bracket)
      
      if (!bracket) {
        console.log('❌ Tournament bracket not found')
        setError(`Tournament #${tournamentId} not found or bracket unavailable.`)
        return
      }
      
      // Create tournament data from bracket
      const tournamentData: TournamentResults = {
        id: tournamentId,
        name: `Tournament #${tournamentId}`,
        mode: bracket.tournament.mode || 0,
        entryFee: bracket.tournament.entryFee ? ethers.formatEther(bracket.tournament.entryFee) : "0",
        prizePool: bracket.tournament.prizePool ? ethers.formatEther(bracket.tournament.prizePool) : "0",
        maxParticipants: bracket.tournament.maxParticipants || 0,
        currentParticipants: bracket.participants?.length || 0,
        status: bracket.tournament.status || 0,
        winner: bracket.tournament.winner || "",
        participants: bracket.participants || [],
        rounds: bracket.rounds || []
      }
      
      console.log('🎉 Setting tournament data:', tournamentData)
      setTournament(tournamentData)
      
    } catch (error) {
      console.error('❌ Error loading tournament results:', error)
      setError(`Failed to load tournament results: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return "TBD"
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const checkIfIWon = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0 && tournament) {
          const myAddress = accounts[0].toLowerCase()
          const winnerAddress = tournament.winner.toLowerCase()
          
          if (myAddress === winnerAddress) {
            alert('🎉 Congratulations! You won this tournament!')
          } else {
            alert('Not this time! Keep playing to win!')
          }
        } else {
          alert('Please connect your wallet to check if you won!')
        }
      })
    } else {
      alert('Please connect your wallet to check if you won!')
    }
  }

  const getGameModeIcon = (mode: UnifiedGameMode) => {
    const iconName = getModeIcon(mode)
    return iconName
  }

  const getGameModeColor = (mode: UnifiedGameMode) => {
    switch (mode) {
      case UnifiedGameMode.QUICK_DRAW:
        return 'bg-red-500/20 text-red-400'
      case UnifiedGameMode.STRATEGIC:
        return 'bg-blue-500/20 text-blue-400'
      case UnifiedGameMode.HARDCORE_MYSTERY:
        return 'bg-purple-500/20 text-purple-400'
      case UnifiedGameMode.LAST_STAND:
        return 'bg-orange-500/20 text-orange-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading tournament results...</p>
            <p className="text-sm text-slate-400 mt-2">This should be fast now!</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Tournament Results</h1>
            <p className="text-red-400 mb-6">{error || 'Tournament not found'}</p>
            <Link href="/tournaments">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tournaments
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tournaments">
            <Button variant="outline" className="mb-4 text-white border-white/20 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">{tournament.name} - Results</h1>
            <div className="flex items-center justify-center space-x-4 text-slate-300">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Tournament #{tournament.id}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {tournament.currentParticipants} participants
              </span>
            </div>
            
            {/* Refresh button */}
            <div className="mt-4">
              <Button 
                onClick={loadTournamentResults}
                variant="outline" 
                size="sm"
                className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2 rotate-90" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Tournament Summary */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
              Tournament Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
                         <div className="grid md:grid-cols-4 gap-6">
               <div className="text-center">
                 <div className={`w-16 h-16 ${getGameModeColor(tournament.mode)} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                   <span className="text-2xl">{getGameModeIcon(tournament.mode)}</span>
                 </div>
                 <p className="text-sm text-slate-400">Game Mode</p>
                 <p className="font-bold text-white">{getModeName(tournament.mode)}</p>
               </div>
               
               <div className="text-center">
                 <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                   <DollarSign className="w-8 h-8" />
                 </div>
                 <p className="text-sm text-slate-400">Entry Fee</p>
                 <p className="font-bold text-white">{tournament.entryFee} MNT</p>
               </div>
               
               <div className="text-center">
                 <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                   <Trophy className="w-8 h-8" />
                 </div>
                 <p className="text-sm text-slate-400">Prize Pool</p>
                 <p className="font-bold text-white">{tournament.prizePool} MNT</p>
               </div>
               
               <div className="text-center">
                 <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                   <Users className="w-8 h-8" />
                 </div>
                 <p className="text-sm text-slate-400">Participants</p>
                 <p className="font-bold text-white">{tournament.currentParticipants}</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Winner Announcement */}
        {tournament.winner && tournament.winner !== "0x0000000000000000000000000000000000000000" && (
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 shadow-2xl mb-8">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-12 h-12 text-yellow-500 mr-4" />
                <h2 className="text-3xl font-bold text-yellow-400">Tournament Winner!</h2>
              </div>
              <p className="text-xl text-white mb-2">
                {formatAddress(tournament.winner)}
              </p>
              <p className="text-lg text-yellow-300 mb-4">
                Won {tournament.prizePool} MNT
              </p>
              
              {/* Check Prize Button */}
              <Button 
                onClick={() => window.open(`https://basescan.org/address/${tournament.winner}`, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Check Prize on Explorer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tournament Bracket Results */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-white">Tournament Bracket Results</CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.rounds && tournament.rounds.length > 0 ? (
              tournament.rounds.map((round, roundIndex) => (
                <div key={round.round} className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                      Round {round.round}
                    </span>
                    {round.round === tournament.rounds.length ? 'Final' : `Round ${round.round}`}
                  </h3>
                  
                  <div className="space-y-4">
                    {round.matches && round.matches.map((match, matchIndex) => (
                      <div key={match.index} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`text-center p-3 rounded-lg ${
                                match.winner === match.player1 ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-600/50'
                              }`}>
                                <p className="text-sm text-slate-400">Player 1</p>
                                <p className="font-bold text-white">{formatAddress(match.player1)}</p>
                                {match.winner === match.player1 && (
                                  <Badge className="bg-green-500 text-white mt-2">Winner</Badge>
                                )}
                              </div>
                              
                              <div className={`text-center p-3 rounded-lg ${
                                match.winner === match.player2 ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-600/50'
                              }`}>
                                <p className="text-sm text-slate-400">Player 2</p>
                                <p className="font-bold text-white">{formatAddress(match.player2)}</p>
                                {match.winner === match.player2 && (
                                  <Badge className="bg-green-500 text-white mt-2">Winner</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 text-center">
                            <div className="text-sm text-slate-400 mb-1">Match</div>
                            <div className="text-lg font-bold text-white">#{match.index + 1}</div>
                            <Badge variant={match.done ? "default" : "secondary"} className="mt-2">
                              {match.done ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300 mb-2">Bracket Information Unavailable</h3>
                <p className="text-slate-400">
                  Tournament bracket details are not available yet. This usually means the tournament hasn't started or the bracket hasn't been generated.
                </p>
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <strong>Tournament Status:</strong> {tournament.status === 0 ? 'Registration' : 
                                                       tournament.status === 1 ? 'Active' : 
                                                       tournament.status === 2 ? 'Completed' : 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong>Participants:</strong> {tournament.currentParticipants}/{tournament.maxParticipants}
                  </p>
                  {tournament.winner && tournament.winner !== "0x0000000000000000000000000000000000000000" && (
                    <p className="text-sm text-green-400 mt-2">
                      <strong>Winner:</strong> {formatAddress(tournament.winner)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prize Verification */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-500" />
              Prize Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-bold text-green-400 mb-2">🏆 Tournament Winner</h4>
                <p className="text-white mb-2">
                  <strong>Address:</strong> {formatAddress(tournament.winner)}
                </p>
                <p className="text-green-300 mb-2">
                  <strong>Prize Amount:</strong> {tournament.prizePool} MNT
                </p>
                <p className="text-sm text-slate-300">
                  The prize has been automatically credited to the winner's wallet address above.
                </p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-400 mb-2">💡 How to Verify Your Prize</h4>
                <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                  <li>Check your wallet balance for an increase of {tournament.prizePool} MNT</li>
                  <li>Look for a transaction from the tournament contract address</li>
                  <li>Verify the transaction on the blockchain explorer</li>
                  <li>Check your transaction history in your wallet</li>
                </ol>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="font-bold text-yellow-400 mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                  <li>Prizes are automatically distributed when the admin records the final result</li>
                  <li>Transaction may take a few minutes to appear in your wallet</li>
                  <li>If you don't see the prize, check your wallet's transaction history</li>
                  <li>Contact support if the prize hasn't been received within 24 hours</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={checkIfIWon}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Check If I Won This Tournament
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">All Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.participants.map((participant, index) => (
                <div key={participant} className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold">{index + 1}</span>
                  </div>
                  <p className="text-white font-medium">{formatAddress(participant)}</p>
                  {participant === tournament.winner && (
                    <Badge className="bg-yellow-500 text-white mt-2">🏆 Winner</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debug Tournament Loading */}
        <div className="text-center mt-4">
          <details className="inline-block">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
              Debug: Tournament Loading & Performance
            </summary>
            <div className="mt-2 text-xs text-slate-400 bg-slate-800/40 rounded p-2 text-left">
              <div>Tournament ID: {tournamentId}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Tournament Data: {tournament ? 'Loaded' : 'Not loaded'}</div>
              {tournament && (
                <>
                  <div>Tournament Name: {tournament.name}</div>
                  <div>Status: {tournament.status}</div>
                  <div>Winner: {tournament.winner || 'None'}</div>
                  <div>Participants: {tournament.participants?.length || 0}</div>
                  <div>Rounds: {tournament.rounds?.length || 0}</div>
                </>
              )}
                             <div className="mt-2 pt-2 border-t border-slate-600">
                 <div className="font-bold text-blue-400">Performance Features:</div>
                 <div>✅ Direct hook usage (fast)</div>
                 <div>✅ Single API call</div>
                 <div>✅ Simple loading state</div>
                 <div>✅ No complex parallel operations</div>
                 <div>✅ Clean data structure</div>
               </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
