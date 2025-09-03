/**
 * Farcaster Frame Detection Utility
 * Based on mintmymood's implementation
 */

import { useState, useEffect } from 'react';

export interface FarcasterFrameInfo {
  isInFrame: boolean;
  frameType: 'farcaster' | 'warpcast' | 'miniapp' | 'unknown';
  userAgent: string;
  url: string;
}

/**
 * Detects if the app is running inside a Farcaster Frame
 * Uses multiple detection methods for reliability
 */
export function detectFarcasterFrame(): FarcasterFrameInfo {
  if (typeof window === 'undefined') {
    return {
      isInFrame: false,
      frameType: 'unknown',
      userAgent: '',
      url: '',
    };
  }

  const userAgent = navigator.userAgent;
  const url = window.location.href;

  // Multiple detection methods
  const urlChecks = [
    url.includes('farcaster'),
    url.includes('warpcast'),
    url.includes('miniapps'),
  ];

  const userAgentChecks = [
    userAgent.includes('Farcaster'),
    userAgent.includes('Warpcast'),
  ];

  const windowChecks = [
    !!(window as any).farcaster,
    !!(window as any).warpcast,
    !!(window as any).miniapp,
  ];

  const isInFrame = urlChecks.some(Boolean) || 
                   userAgentChecks.some(Boolean) || 
                   windowChecks.some(Boolean);

  // Determine frame type
  let frameType: FarcasterFrameInfo['frameType'] = 'unknown';
  
  if (url.includes('farcaster') || userAgent.includes('Farcaster') || (window as any).farcaster) {
    frameType = 'farcaster';
  } else if (url.includes('warpcast') || userAgent.includes('Warpcast') || (window as any).warpcast) {
    frameType = 'warpcast';
  } else if (url.includes('miniapps') || (window as any).miniapp) {
    frameType = 'miniapp';
  }

  return {
    isInFrame,
    frameType,
    userAgent,
    url,
  };
}

/**
 * Hook to get Farcaster Frame detection info
 */
export function useFarcasterFrameDetection() {
  const [frameInfo, setFrameInfo] = useState<FarcasterFrameInfo>({
    isInFrame: false,
    frameType: 'unknown',
    userAgent: '',
    url: '',
  });

  useEffect(() => {
    const info = detectFarcasterFrame();
    setFrameInfo(info);
  }, []);

  return frameInfo;
}


