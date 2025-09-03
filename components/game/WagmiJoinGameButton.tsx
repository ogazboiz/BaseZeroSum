'use client';

import { useState } from 'react';
import { useWagmiZeroSumContract } from '@/hooks/useWagmiZeroSumContract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Game {
  id: number;
  gameType: 'QuickDraw' | 'Strategic';
  entryFee: string;
  status: 'Waiting' | 'Active' | 'Finished';
  player1: string;
  player2?: string;
  currentNumber?: number;
  lastMoveTime?: number;
  moveTimer?: number;
}

interface WagmiJoinGameButtonProps {
  game: Game;
  onJoinSuccess?: () => void;
}

export function WagmiJoinGameButton({ game, onJoinSuccess }: WagmiJoinGameButtonProps) {
  const [isJoining, setIsJoining] = useState(false);
  const { joinGame, isConnected, address } = useWagmiZeroSumContract();

  const canJoin = game.status === 'Waiting' && game.player1 !== address;

  const handleJoinGame = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!canJoin) {
      toast.error('Cannot join this game');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinGame(game.id, game.entryFee);
      if (result.success) {
        toast.success('Successfully joined the game!');
        onJoinSuccess?.();
      }
    } catch (error) {
      console.error('Error joining game:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Finished':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'QuickDraw':
        return '⚡';
      case 'Strategic':
        return '🧠';
      default:
        return '🎮';
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Wallet Required
          </CardTitle>
          <CardDescription>
            Please connect your wallet to join games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Connect your wallet to join this game.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{getGameTypeIcon(game.gameType)}</span>
            Game #{game.id}
          </CardTitle>
          <Badge className={getStatusColor(game.status)}>
            {game.status}
          </Badge>
        </div>
        <CardDescription>
          {game.gameType} Game • Entry Fee: {game.entryFee} ETH
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Players: {game.player2 ? '2/2' : '1/2'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-muted-foreground" />
            <span>Pot: {(parseFloat(game.entryFee) * (game.player2 ? 2 : 1)).toFixed(3)} ETH</span>
          </div>
          {game.currentNumber && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Number:</span>
              <span className="font-mono font-bold text-lg">{game.currentNumber}</span>
            </div>
          )}
          {game.moveTimer && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Timer: {game.moveTimer}s</span>
            </div>
          )}
        </div>

        {/* Player Addresses */}
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Player 1: </span>
            <span className="font-mono">
              {game.player1.slice(0, 6)}...{game.player1.slice(-4)}
              {game.player1 === address && (
                <Badge variant="secondary" className="ml-2">You</Badge>
              )}
            </span>
          </div>
          {game.player2 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Player 2: </span>
              <span className="font-mono">
                {game.player2.slice(0, 6)}...{game.player2.slice(-4)}
                {game.player2 === address && (
                  <Badge variant="secondary" className="ml-2">You</Badge>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Join Button */}
        {canJoin ? (
          <Button
            onClick={handleJoinGame}
            disabled={isJoining}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Joining...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Join Game ({game.entryFee} ETH)
              </div>
            )}
          </Button>
        ) : game.player1 === address ? (
          <div className="text-center text-sm text-muted-foreground">
            You created this game
          </div>
        ) : game.status !== 'Waiting' ? (
          <div className="text-center text-sm text-muted-foreground">
            Game is not available for joining
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Cannot join this game
          </div>
        )}
      </CardContent>
    </Card>
  );
}
