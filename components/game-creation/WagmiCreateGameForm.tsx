'use client';

import { useState } from 'react';
import { useWagmiZeroSumContract } from '@/hooks/useWagmiZeroSumContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Brain, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WagmiCreateGameForm() {
  const [entryFee, setEntryFee] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);
  const { 
    createQuickDraw, 
    createStrategic, 
    isConnected, 
    address 
  } = useWagmiZeroSumContract();

  const handleCreateQuickDraw = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!entryFee || parseFloat(entryFee) <= 0) {
      toast.error('Please enter a valid entry fee');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createQuickDraw(entryFee);
      if (result.success) {
        toast.success('Quick Draw game created successfully!');
        // Optionally redirect or refresh game list
      }
    } catch (error) {
      console.error('Error creating Quick Draw game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateStrategic = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!entryFee || parseFloat(entryFee) <= 0) {
      toast.error('Please enter a valid entry fee');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createStrategic(entryFee);
      if (result.success) {
        toast.success('Strategic game created successfully!');
        // Optionally redirect or refresh game list
      }
    } catch (error) {
      console.error('Error creating Strategic game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Wallet Required
          </CardTitle>
          <CardDescription>
            Please connect your wallet to create games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Connect your wallet using the button above to start creating games.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-emerald-500" />
          Create New Game
        </CardTitle>
        <CardDescription>
          Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entry Fee Input */}
        <div className="space-y-2">
          <label htmlFor="entryFee" className="text-sm font-medium">
            Entry Fee (ETH)
          </label>
          <Input
            id="entryFee"
            type="number"
            step="0.001"
            min="0.001"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="0.01"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Minimum: 0.001 ETH
          </p>
        </div>

        {/* Game Type Tabs */}
        <Tabs defaultValue="quickdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quickdraw" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Draw
            </TabsTrigger>
            <TabsTrigger value="strategic" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Strategic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quickdraw" className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Quick Draw Game</h3>
              <p className="text-sm text-muted-foreground">
                Fast-paced games where speed matters. Perfect for quick matches!
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 30-second move timer</li>
                <li>• Fast gameplay</li>
                <li>• High intensity</li>
              </ul>
            </div>
            <Button
              onClick={handleCreateQuickDraw}
              disabled={isCreating}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Create Quick Draw Game
                </div>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="strategic" className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Strategic Game</h3>
              <p className="text-sm text-muted-foreground">
                Thoughtful games where strategy wins. Take your time to plan!
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 2-minute move timer</li>
                <li>• Strategic gameplay</li>
                <li>• Deep thinking</li>
              </ul>
            </div>
            <Button
              onClick={handleCreateStrategic}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Create Strategic Game
                </div>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Game Rules */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Game Rules:</p>
          <ul className="space-y-1">
            <li>• Players take turns subtracting from a starting number</li>
            <li>• Last player to make a valid move wins</li>
            <li>• Winner takes the entire pot</li>
            <li>• Games auto-finish after timeout</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
