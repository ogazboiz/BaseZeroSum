'use client';

import { useFarcasterSDK } from '@/hooks/useFarcasterSDK';
import { useEffect } from 'react';

export default function FarcasterSDKProvider({ children }: { children: React.ReactNode }) {
  const { isReady, isInFarcaster } = useFarcasterSDK();

  useEffect(() => {
    if (isInFarcaster) {
      console.log('🎮 Farcaster Mini App - SDK ready:', isReady);
    }
  }, [isReady, isInFarcaster]);

  // Show loading screen only in Farcaster until ready
  if (isInFarcaster && !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading ZeroSum Arena...</h2>
          <p className="text-slate-400">Preparing your gaming experience</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
