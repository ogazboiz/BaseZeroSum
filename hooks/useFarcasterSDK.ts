import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function useFarcasterSDK() {
  const [isReady, setIsReady] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);

  useEffect(() => {
    // Check if we're in a Farcaster frame
    const checkFarcaster = () => {
      if (typeof window === 'undefined') return false;
      
      const url = window.location.href;
      const userAgent = navigator.userAgent;
      const search = window.location.search;
      
      return url.includes('farcaster') || 
             userAgent.includes('Farcaster') ||
             url.includes('warpcast') ||
             userAgent.includes('Warpcast') ||
             url.includes('miniapps') ||
             search.includes('farcaster') ||
             (window as any).farcaster ||
             (window as any).warpcast ||
             (window as any).miniapp ||
             url.includes('farcaster.xyz/miniapps') ||
             document.referrer.includes('farcaster') ||
             document.referrer.includes('warpcast') ||
             window.parent !== window ||
             window.location !== window.parent.location;
    };

    const inFarcaster = checkFarcaster();
    setIsInFarcaster(inFarcaster);

    if (inFarcaster) {
      console.log('🎮 Farcaster Mini App detected, calling sdk.actions.ready()');
      
      // Call ready() to hide the splash screen
      sdk.actions.ready()
        .then(() => {
          console.log('✅ Farcaster SDK ready() called successfully');
          setIsReady(true);
        })
        .catch((error) => {
          console.error('❌ Failed to call Farcaster SDK ready():', error);
          setIsReady(true); // Set ready anyway to avoid infinite loading
        });
    } else {
      console.log('🌐 Not in Farcaster frame, skipping SDK ready()');
      setIsReady(true);
    }
  }, []);

  return {
    isReady,
    isInFarcaster,
    sdk: isInFarcaster ? sdk : null
  };
}
