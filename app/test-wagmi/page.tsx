'use client';

import { useState } from 'react';
import { useWagmiZeroSumContract } from '@/hooks/useWagmiZeroSumContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Brain, Play, Target, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TestWagmiPage() {
  const [entryFee, setEntryFee] = useState('0.01');
  const [gameId, setGameId] = useState('');
  const [subtraction, setSubtraction] = useState('');
  
  const { 
    createQuickDraw, 
    createStrategic, 
    joinGame,
    makeMove,
    isConnected, 
    address 
  } = useWagmiZeroSumContract();

  const handleCreateQuickDraw = async () => {
    const result = await createQuickDraw(entryFee);
    if (result.success) {
      console.log('Quick Draw created:', result);
    }
  };

  const handleCreateStrategic = async () => {
    const result = await createStrategic(entryFee);
    if (result.success) {
      console.log('Strategic created:', result);
    }
  };

  const handleJoinGame = async () => {
    if (!gameId) {
      toast.error('Please enter a game ID');
      return;
    }
    const result = await joinGame(parseInt(gameId), entryFee);
    if (result.success) {
      console.log('Joined game:', result);
    }
  };

  const handleMakeMove = async () => {
    if (!gameId || !subtraction) {
      toast.error('Please enter game ID and subtraction');
      return;
    }
    const result = await makeMove(parseInt(gameId), parseInt(subtraction));
    if (result.success) {
      console.log('Move made:', result);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Wagmi Transaction Test</h1>
          <p className="text-lg text-gray-300">
            Test Farcaster-compatible transactions using wagmi hooks
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Disconnected
                </Badge>
              )}
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div>
                <p className="text-sm text-muted-foreground">Address:</p>
                <p className="font-mono text-sm">{address}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to test transactions
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Create Games
              </CardTitle>
              <CardDescription>
                Test creating games with wagmi transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Entry Fee (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0.01"
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleCreateQuickDraw}
                  disabled={!isConnected}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create Quick Draw
                </Button>
                
                <Button
                  onClick={handleCreateStrategic}
                  disabled={!isConnected}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Create Strategic
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Join Game
              </CardTitle>
              <CardDescription>
                Test joining games with wagmi transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Game ID</label>
                <Input
                  type="number"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="123"
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleJoinGame}
                disabled={!isConnected || !gameId}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Make Move */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Make Move
              </CardTitle>
              <CardDescription>
                Test making moves with wagmi transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Game ID</label>
                <Input
                  type="number"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="123"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Subtraction</label>
                <Input
                  type="number"
                  min="1"
                  value={subtraction}
                  onChange={(e) => setSubtraction(e.target.value)}
                  placeholder="5"
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleMakeMove}
                disabled={!isConnected || !gameId || !subtraction}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Make Move
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>1. Connect Wallet:</strong> Use the Enhanced Connect Button to connect your Farcaster wallet</p>
                <p><strong>2. Create Game:</strong> Set entry fee and create a Quick Draw or Strategic game</p>
                <p><strong>3. Join Game:</strong> Enter a game ID to join an existing game</p>
                <p><strong>4. Make Move:</strong> Enter game ID and subtraction amount to make a move</p>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Farcaster Benefits:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Auto-connects when in Farcaster Frame</li>
                  <li>Seamless transaction signing</li>
                  <li>No wallet popup interruptions</li>
                  <li>Native Farcaster wallet integration</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
