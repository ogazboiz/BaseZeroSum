'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { detectFarcasterFrame } from '@/utils/farcasterDetection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientOnly } from '@/hooks/useClientOnly';

export function FarcasterTestPanel() {
  const isClient = useClientOnly();
  const [frameInfo, setFrameInfo] = useState({
    isInFrame: false,
    frameType: 'unknown' as const,
    userAgent: '',
    url: '',
  });
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isClient) return;
    
    setFrameInfo(detectFarcasterFrame());
    
    const interval = setInterval(() => {
      setFrameInfo(detectFarcasterFrame());
    }, 1000);
    return () => clearInterval(interval);
  }, [isClient]);

  const testFarcasterConnection = () => {
    const farcasterConnector = connectors.find(
      (connector) => 
        connector.id === "farcaster" || 
        connector.name?.toLowerCase().includes('farcaster') ||
        connector.name?.toLowerCase().includes('miniapp')
    );
    
    if (farcasterConnector) {
      connect({ connector: farcasterConnector });
    }
  };

  const simulateFarcasterFrame = () => {
    // Simulate Farcaster environment
    Object.defineProperty(window, 'location', {
      value: { href: 'https://farcaster.xyz/miniapp/test' },
      writable: true
    });
    setFrameInfo(detectFarcasterFrame());
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">🧪 Farcaster Integration Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frame Detection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Frame Detection</div>
            <div className={`text-lg font-bold ${frameInfo.isInFrame ? 'text-green-400' : 'text-red-400'}`}>
              {frameInfo.isInFrame ? '✅ In Frame' : '❌ Not in Frame'}
            </div>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Frame Type</div>
            <div className="text-lg font-bold text-cyan-400">
              {frameInfo.frameType}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Wallet Connected</div>
            <div className={`text-lg font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? '✅ Connected' : '❌ Not Connected'}
            </div>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-400">Address</div>
            <div className="text-sm font-mono text-cyan-400">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}
            </div>
          </div>
        </div>

        {/* Available Connectors */}
        <div className="p-3 bg-slate-800 rounded-lg">
          <div className="text-sm text-slate-400 mb-2">Available Connectors</div>
          <div className="space-y-1">
            {connectors.map((connector) => (
              <div key={connector.id} className="text-xs text-slate-300">
                <span className="font-mono">{connector.id}</span>
                <span className="text-slate-500 ml-2">({connector.name})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testFarcasterConnection}
            className="bg-purple-600 hover:bg-purple-700"
          >
            🔗 Test Farcaster Connection
          </Button>
          <Button 
            onClick={simulateFarcasterFrame}
            variant="outline"
            className="border-amber-500 text-amber-300 hover:bg-amber-900/20"
          >
            🎭 Simulate Farcaster Frame
          </Button>
          <Button 
            onClick={() => setFrameInfo(detectFarcasterFrame())}
            variant="outline"
            className="border-cyan-500 text-cyan-300 hover:bg-cyan-900/20"
          >
            🔄 Refresh Detection
          </Button>
        </div>

        {/* Debug Info */}
        <div className="p-3 bg-slate-900 rounded-lg">
          <div className="text-sm text-slate-400 mb-2">Debug Info</div>
          <pre className="text-xs text-slate-300 overflow-auto">
            {isClient ? JSON.stringify(frameInfo, null, 2) : 'Loading...'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
