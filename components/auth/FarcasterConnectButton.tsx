'use client';

import { useState, useRef, useEffect } from 'react';
import { useConnectors, useAccount, useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, User, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FarcasterConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [pendingConnectorUID, setPendingConnectorUID] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Check if we're in a Farcaster Frame context
    const checkFarcasterFrame = () => {
      if (typeof window !== 'undefined') {
        // More comprehensive Farcaster Frame detection
        const inFrame = window.location.href.includes('farcaster') || 
                       navigator.userAgent.includes('Farcaster') ||
                       window.location.href.includes('warpcast') ||
                       navigator.userAgent.includes('Warpcast') ||
                       window.location.href.includes('miniapps') ||
                       window.location.href.includes('zerosum') ||
                       // Check for Farcaster-specific query parameters
                       window.location.search.includes('farcaster') ||
                       // Check for Farcaster-specific headers or context
                       (window as any).farcaster ||
                       (window as any).warpcast ||
                       // Check for Mini App specific context
                       (window as any).miniapp ||
                       // Check for specific ZeroSum Mini App
                       window.location.href.includes('farcaster.xyz/miniapps');
        
        setIsInFarcasterFrame(inFrame);
        
        console.log('Window location:', window.location.href);
        console.log('User agent:', navigator.userAgent);
        console.log('Is in Farcaster Frame:', inFrame);
        console.log('Farcaster context:', (window as any).farcaster);
        console.log('Warpcast context:', (window as any).warpcast);
        console.log('Mini App context:', (window as any).miniapp);
      }
    };
    
    checkFarcasterFrame();
  }, []);

  // Auto-connect to Farcaster if in Farcaster Frame and not already connected
  useEffect(() => {
    if (isInFarcasterFrame && !isConnected && isClient) {
      const farcasterConnector = connectors.find(
        (connector) => 
          connector.id === "farcaster" || 
          connector.name?.toLowerCase().includes('farcaster') ||
          connector.name?.toLowerCase().includes('miniapp') ||
          connector.uid?.includes('farcaster')
      );
      
      if (farcasterConnector) {
        console.log('Auto-connecting to Farcaster...');
        connect({ connector: farcasterConnector });
      }
    }
  }, [connectors, connect, isConnected, isInFarcasterFrame, isClient]);

  // Debug: Log all available connectors
  useEffect(() => {
    if (isClient) {
      console.log('Available connectors:', connectors.map(c => ({
        id: c.id,
        name: c.name,
        uid: c.uid,
        ready: c.ready,
        type: typeof c.connect,
        hasConnect: typeof c.connect === 'function',
        hasDisconnect: typeof c.disconnect === 'function'
      })));
    }
  }, [connectors, isClient]);

  // Monitor connection state and close modal when connected
  useEffect(() => {
    console.log('Connection state changed:', { isConnected, address });
    if (isConnected && address) {
      console.log('✅ User is connected! Closing modal...');
      console.log('Connected address:', address);
      setIsModalOpen(false);
    }
  }, [isConnected, address]);

  // Remove duplicates and filter connectors
  const uniqueConnectors = Array.from(
    new Map(connectors.map((c) => [c.name, c])).values()
  );

  // Find Farcaster connector and prioritize it
  const farcasterConnector = uniqueConnectors.find(
    (connector) => 
      connector.id === "farcaster" || 
      connector.name?.toLowerCase().includes('farcaster') ||
      connector.name?.toLowerCase().includes('miniapp') ||
      connector.uid?.includes('farcaster')
  );
  
  const walletConnectConnector = uniqueConnectors.find(
    (connector) => connector.id === "walletConnect"
  );
  
  const otherConnectors = uniqueConnectors.filter(
    (connector) => 
      connector.id !== "walletConnect" && 
      connector.id !== "farcaster" && 
      !connector.name?.toLowerCase().includes('farcaster')
  );

  // Helper function to get wallet icon with better fallbacks
  const getWalletIcon = (connector: any) => {
    // Special handling for Farcaster
    if (connector.id === "farcaster" || connector.name?.toLowerCase().includes('farcaster')) {
      return "https://warpcast.com/~/channel-images/farcaster.png";
    }
    
    // Special handling for WalletConnect
    if (connector.id === "walletConnect") {
      return "https://avatars.githubusercontent.com/u/37784886?s=200&v=4";
    }

    // Special handling for MetaMask
    if (connector.id === "metaMaskSDK" || connector.name?.toLowerCase().includes('metamask')) {
      return "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
    }

    // Special handling for Coinbase Wallet
    if (connector.id === "coinbaseWalletSDK" || connector.name?.toLowerCase().includes('coinbase')) {
      return "https://avatars.githubusercontent.com/u/18060234?s=200&v=4";
    }

    // If connector provides a base64 or URL icon
    if (connector.icon) {
      if (typeof connector.icon === "string") {
        return connector.icon;
      }
      if (connector.icon?.url) {
        return connector.icon.url;
      }
    }

    // Default generic Ethereum icon
    return "https://cdn.iconscout.com/icon/free/png-256/ethereum-2752194-2285011.png";
  };

  const connectWallet = async (connector: any) => {
    try {
      const isFarcasterConnector = connector.id === "farcaster" || 
                                   connector.name?.toLowerCase().includes('farcaster') ||
                                   connector.name?.toLowerCase().includes('miniapp');
      
      console.log('Attempting to connect with connector:', {
        id: connector.id,
        name: connector.name,
        uid: connector.uid,
        ready: connector.ready,
        type: typeof connector.connect,
        isFarcaster: isFarcasterConnector,
        isInFarcasterFrame,
        connectorKeys: Object.keys(connector)
      });
      
      // Check if this is the Farcaster connector and we're not in a Farcaster Frame
      if (isFarcasterConnector && !isInFarcasterFrame) {
        console.warn('Farcaster connector requires Farcaster Frame context');
        toast.error('Farcaster wallet connection is only available when using this app within Farcaster. Please open this app in Farcaster to connect your wallet.');
        return;
      }
      
      setPendingConnectorUID(connector.uid);
      
      // For Farcaster connector, we might need to handle it differently
      if (isFarcasterConnector) {
        console.log('Handling Farcaster connector specifically...');
        
        if (connector.connect) {
          console.log('Using standard connect method...');
          const result = await connector.connect();
          console.log('Farcaster connection result:', result);
          
          // Check if connection was successful
          if (result && result.accounts && result.accounts.length > 0) {
            console.log('✅ Farcaster connection successful!');
            console.log('Connected account:', result.accounts[0]);
            console.log('Connected chain:', result.chainId);
            toast.success('Connected to Farcaster!');
            
            // Force a re-render to update the UI state
            setTimeout(() => {
              console.log('Forcing UI update after successful connection...');
              window.dispatchEvent(new Event('resize'));
            }, 100);
          } else {
            console.warn('Farcaster connection result seems incomplete:', result);
          }
        } else {
          throw new Error('No connect method found on Farcaster connector');
        }
      } else {
        // Standard connector handling
        console.log('Handling standard connector:', connector.name);
        
        if (connector.ready === false) {
          console.error('Connector explicitly not ready:', connector);
          throw new Error('Connector is not ready');
        }
        
        // Wait a bit for the connector to initialize if ready is undefined
        if (connector.ready === undefined) {
          console.log('Connector ready state is undefined, waiting for initialization...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Check if connect method exists
        if (typeof connector.connect !== 'function') {
          console.error('Connect method not found on connector:', connector);
          throw new Error('Connect method not available');
        }
        
        console.log('Calling connector.connect()...');
        const result = await connector.connect();
        console.log('Connection result:', result);
        toast.success('Wallet connected successfully!');
      }
      
      setIsModalOpen(false); // Close modal on successful connection
    } catch (error) {
      console.error('Connection error:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        toast.error(`Connection failed: ${error.message}`);
      } else {
        toast.error('Connection failed. Please try again.');
      }
    } finally {
      setPendingConnectorUID(null);
    }
  };

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // If connected, show connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <div className="text-white font-medium">
              {truncateAddress(address)}
            </div>
            <div className="text-cyan-400 text-xs">
              {isInFarcasterFrame ? 'Farcaster Wallet' : 'Connected'}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  // If not connected, show connect button
  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        onClick={() => setIsModalOpen(!isModalOpen)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {isModalOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 md:origin-top-right md:rounded-xl md:border md:border-gray-200 md:bg-white md:p-4 md:shadow-lg">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:max-w-none md:border-none md:shadow-none md:p-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#222222]">Connect a Wallet</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#666666] hover:text-[#222222]"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* Helpful message for Farcaster users */}
                {!isInFarcasterFrame && farcasterConnector && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Want to use Farcaster Wallet?</strong> Open this app in Farcaster to connect your wallet automatically.
                    </p>
                  </div>
                )}

                {/* Farcaster as the primary option */}
                {farcasterConnector && (
                  <div className="mb-4">
                    <h3 className="text-[#666666] text-xs font-medium mb-2">
                      Recommended for Farcaster
                    </h3>
                    <button
                      onClick={() => connectWallet(farcasterConnector)}
                      disabled={pendingConnectorUID === farcasterConnector.uid}
                      className={`w-full flex gap-4 items-center p-4 border-2 rounded-xl transition-all ${
                        isInFarcasterFrame 
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100' 
                          : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <img
                        src={getWalletIcon(farcasterConnector)}
                        className="w-8 h-8"
                        alt="Farcaster"
                        onError={(e) => console.error('Farcaster icon failed to load:', e.currentTarget.src)}
                      />
                      <div className="flex-1 text-left">
                        <span className="text-[#222222] font-semibold">Farcaster Wallet</span>
                        <div className="text-xs text-[#666666]">
                          {isInFarcasterFrame 
                            ? 'Connect with your Farcaster account' 
                            : 'Only available in Farcaster Frame'
                          }
                        </div>
                      </div>

                      {pendingConnectorUID === farcasterConnector.uid && (
                        <div className="w-4 h-4 ml-auto animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      )}
                    </button>
                  </div>
                )}

                {/* Only show other wallets when NOT in Farcaster Frame */}
                {!isInFarcasterFrame && (
                  <>
                    {walletConnectConnector && (
                      <button
                        onClick={() => connectWallet(walletConnectConnector)}
                        disabled={pendingConnectorUID === walletConnectConnector.uid}
                        className="w-full flex gap-4 items-center p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
                      >
                        <img
                          src={getWalletIcon(walletConnectConnector)}
                          className="w-6 h-6"
                          alt="WalletConnect"
                          onError={(e) => console.error('WalletConnect icon failed to load:', e.currentTarget.src)}
                        />
                        <span className="text-[#222222] text-sm">WalletConnect</span>

                        {pendingConnectorUID === walletConnectConnector.uid && (
                          <div className="w-4 h-4 ml-auto animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                        )}
                      </button>
                    )}

                    <h3 className="text-[#666666] text-xs font-medium">
                      Other Wallets
                    </h3>

                    <div className="grid grid-cols-3 gap-1">
                      {otherConnectors.map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => connectWallet(connector)}
                          disabled={pendingConnectorUID === connector.uid}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          <img
                            src={getWalletIcon(connector)}
                            className="w-8 h-8 bg-white p-1 rounded-md"
                            alt={connector.name}
                            onError={(e) => console.error(`${connector.name} icon failed to load:`, e.currentTarget.src)}
                          />
                          <span className="text-[10px] text-[#222222]">
                            {connector.name}
                          </span>

                          {pendingConnectorUID === connector.uid && (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <a
                        href="https://ethereum.org/en/wallets/find-wallet/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-[#00d2ff] hover:underline"
                      >
                        <span>Don't have a wallet? Get one here</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </div>

              <p className="text-[#666666] text-[10px] mt-3 text-center">
                By connecting a wallet, you agree to ZeroSum Arena's Terms of Service
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
