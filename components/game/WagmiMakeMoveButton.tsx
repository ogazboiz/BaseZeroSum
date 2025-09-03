'use client';

import { useState } from 'react';
import { useWagmiZeroSumContract } from '@/hooks/useWagmiZeroSumContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Users, Coins, AlertCircle } from 'lucide-react';
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
  currentPlayer?: string;
  winner?: string;
}

interface WagmiMakeMoveButtonProps {
  game: Game;
  onMoveSuccess?: () => void;
}

export function WagmiMakeMoveButton({ game, onMoveSuccess }: WagmiMakeMoveButtonProps) {
  const [subtraction, setSubtraction] = useState('');
  const [isMakingMove, setIsMakingMove] = useState(false);
  const { makeMove, isConnected, address } = useWagmiZeroSumContract();

  const isMyTurn = game.currentPlayer === address;
  const canMakeMove = game.status === 'Active' && isMyTurn && game.currentNumber && game.currentNumber > 0;

  const handleMakeMove = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!canMakeMove) {
      toast.error('Cannot make a move at this time');
      return;
    }

    const moveValue = parseInt(subtraction);
    if (!moveValue || moveValue <= 0 || moveValue >= (game.currentNumber || 0)) {
      toast.error('Invalid move. Must be between 1 and ' + ((game.currentNumber || 1) - 1));
      return;
    }

    setIsMakingMove(true);
    try {
      const result = await makeMove(game.id, moveValue);
      if (result.success) {
        toast.success('Move made successfully!');
        setSubtraction('');
        onMoveSuccess?.();
      }
    } catch (error) {
      console.error('Error making move:', error);
    } finally {
      setIsMakingMove(false);
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
            Please connect your wallet to make moves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Connect your wallet to make moves in this game.
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
            <span>Pot: {(parseFloat(game.entryFee) * 2).toFixed(3)} ETH</span>
          </div>
          {game.currentNumber && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Number:</span>
              <span className="font-mono font-bold text-2xl text-emerald-600">{game.currentNumber}</span>
            </div>
          )}
          {game.moveTimer && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Timer: {game.moveTimer}s</span>
            </div>
          )}
        </div>

        {/* Current Player */}
        {game.currentPlayer && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Turn:</div>
            <div className="font-mono">
              {game.currentPlayer.slice(0, 6)}...{game.currentPlayer.slice(-4)}
              {game.currentPlayer === address && (
                <Badge variant="secondary" className="ml-2">You</Badge>
              )}
            </div>
          </div>
        )}

        {/* Winner */}
        {game.winner && (
          <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="text-sm text-emerald-800">Winner:</div>
            <div className="font-mono font-bold text-emerald-900">
              {game.winner.slice(0, 6)}...{game.winner.slice(-4)}
              {game.winner === address && (
                <Badge className="ml-2 bg-emerald-600">You Won!</Badge>
              )}
            </div>
          </div>
        )}

        {/* Make Move Section */}
        {canMakeMove ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Your Turn!</div>
              <div className="text-lg font-semibold">
                Subtract a number between 1 and {game.currentNumber! - 1}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="subtraction" className="text-sm font-medium">
                Number to Subtract
              </label>
              <Input
                id="subtraction"
                type="number"
                min="1"
                max={game.currentNumber! - 1}
                value={subtraction}
                onChange={(e) => setSubtraction(e.target.value)}
                placeholder={`1 - ${game.currentNumber! - 1}`}
                className="w-full text-center text-lg"
              />
            </div>

            <Button
              onClick={handleMakeMove}
              disabled={isMakingMove || !subtraction}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isMakingMove ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Making Move...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Make Move
                </div>
              )}
            </Button>
          </div>
        ) : game.status === 'Active' && !isMyTurn ? (
          <div className="text-center text-sm text-muted-foreground">
            Waiting for opponent's move...
          </div>
        ) : game.status === 'Finished' ? (
          <div className="text-center text-sm text-muted-foreground">
            Game finished
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Cannot make a move at this time
          </div>
        )}

        {/* Game Rules */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Rules:</p>
          <ul className="space-y-1">
            <li>• Subtract any number from 1 to {game.currentNumber! - 1}</li>
            <li>• Player who makes the last valid move wins</li>
            <li>• Winner takes the entire pot</li>
            <li>• Game ends when number reaches 0</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
