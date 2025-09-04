'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AppKitConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);

  // Check if we're in a Farcaster Frame
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const userAgent = navigator.userAgent;
      const search = window.location.search;
      
      console.log('🔍 Farcaster Detection Debug:', {
        url,
        userAgent,
        search,
        farcaster: (window as any).farcaster,
        warpcast: (window as any).warpcast,
        miniapp: (window as any).miniapp
      });
      
      const inFrame = url.includes('farcaster') || 
                     userAgent.includes('Farcaster') ||
                     url.includes('warpcast') ||
                     userAgent.includes('Warpcast') ||
                     url.includes('miniapps') ||
                     url.includes('zerosum') ||
                     search.includes('farcaster') ||
                     (window as any).farcaster ||
                     (window as any).warpcast ||
                     (window as any).miniapp ||
                     url.includes('farcaster.xyz/miniapps') ||
                     // Additional Farcaster detection methods
                     document.referrer.includes('farcaster') ||
                     document.referrer.includes('warpcast') ||
                     window.parent !== window ||
                     window.location !== window.parent.location;
      
      console.log('🔍 Is in Farcaster Frame:', inFrame);
      setIsInFarcasterFrame(inFrame);
      
      // Auto-connect to Farcaster if in Farcaster Frame
      if (inFrame && !isConnected) {
        console.log('🔍 Looking for Farcaster connector...');
        console.log('🔍 Available connectors:', connectors.map(c => ({ 
          id: c.id, 
          name: c.name, 
          uid: c.uid,
          ready: c.ready 
        })));
        
        const farcasterConnector = connectors.find(c => 
          c.id === "farcaster" || 
          c.name?.toLowerCase().includes('farcaster') ||
          c.name?.toLowerCase().includes('miniapp') ||
          c.uid?.includes('farcaster')
        );
        
        console.log('🔍 Found Farcaster connector:', farcasterConnector);
        
        if (farcasterConnector) {
          console.log('Auto-connecting to Farcaster...');
          connect({ connector: farcasterConnector });
        } else {
          console.log('❌ No Farcaster connector found');
        }
      }
    }
  }, [connectors, connect, isConnected]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-mono">
          {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
        </span>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => {
          console.log('🔍 Opening wallet dropdown...');
          console.log('🔍 Available connectors:', connectors.map(c => ({ 
            id: c.id, 
            name: c.name, 
            uid: c.uid,
            ready: c.ready 
          })));
          setIsModalOpen(!isModalOpen);
        }}
        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {/* Wallet Selection Dropdown */}
      {isModalOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {isInFarcasterFrame ? (
                <div className="text-center py-4">
                  <p className="text-gray-300 mb-4">
                    You're in Farcaster! Your wallet should connect automatically.
                  </p>
                  <Button
                    onClick={() => {
                      const farcasterConnector = connectors.find(c => 
                        c.id === "farcaster" || 
                        c.name?.toLowerCase().includes('farcaster') ||
                        c.name?.toLowerCase().includes('miniapp')
                      );
                      if (farcasterConnector) {
                        connect({ connector: farcasterConnector });
                        setIsModalOpen(false);
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Connect Farcaster Wallet
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-300 text-sm mb-4">
                    Choose your wallet to connect:
                  </p>
                  
                  {/* Helpful instructions */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-300 mb-2">
                      <strong>Quick Setup:</strong>
                    </p>
                    <ul className="text-xs text-blue-200 space-y-1">
                      <li>• Install <strong>MetaMask</strong> extension and unlock it</li>
                      <li>• Or install <strong>Coinbase Wallet</strong> extension</li>
                      <li>• Make sure your wallet is unlocked</li>
                      <li>• Switch to <strong>Base Sepolia</strong> network</li>
                    </ul>
                  </div>
                  
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mb-2">
                    Available connectors: {connectors.length} | 
                    Ready: {connectors.filter(c => c.ready).length}
                  </div>
                  
                  {connectors.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 mb-2">No wallet connectors available</p>
                      <p className="text-xs text-gray-500">
                        Make sure you have MetaMask or Coinbase Wallet installed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Show unique connectors only */}
                      {connectors
                        .filter((connector, index, self) => 
                          // Remove duplicates by name and exclude WalletConnect
                          index === self.findIndex(c => c.name === connector.name) &&
                          !connector.name?.toLowerCase().includes('walletconnect') &&
                          !connector.id?.toLowerCase().includes('walletconnect')
                        )
                        .map((connector) => {
                          const isFarcaster = connector.id === "farcaster" || 
                                            connector.name?.toLowerCase().includes('farcaster') ||
                                            connector.name?.toLowerCase().includes('miniapp');
                          
                          return (
                            <Button
                              key={connector.uid}
                              onClick={() => {
                                console.log('Connecting to:', connector.name);
                                
                                // Check if trying to connect to Farcaster outside Farcaster environment
                                if (isFarcaster && !isInFarcasterFrame) {
                                  toast.error(
                                    "Farcaster wallet is only available within Farcaster/Warpcast. Please open this app in Farcaster to use your Farcaster wallet.",
                                    { duration: 5000 }
                                  );
                                  return;
                                }
                                
                                connect({ connector });
                                setIsModalOpen(false);
                              }}
                              className={`w-full justify-start text-white ${
                                isFarcaster 
                                  ? 'bg-purple-600 hover:bg-purple-700' 
                                  : connector.ready 
                                    ? 'bg-slate-700 hover:bg-slate-600' 
                                    : 'bg-gray-600 hover:bg-gray-500 opacity-75'
                              }`}
                            >
                              <Wallet className="w-4 h-4 mr-3" />
                              {connector.name || connector.id}
                              {!connector.ready && !isFarcaster && (
                                <span className="ml-auto text-xs opacity-60">(try anyway)</span>
                              )}
                              {isFarcaster && !isInFarcasterFrame && (
                                <span className="ml-auto text-xs text-yellow-400">(Farcaster only)</span>
                              )}
                            </Button>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
