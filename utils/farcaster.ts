/**
 * Utility functions for Farcaster Mini App detection and URL handling
 */

export function isInFarcasterFrame(): boolean {
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
}

export function getAppUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_URL || 'https://zerosum-arena.vercel.app';
  }
  
  // If in Farcaster frame, use the deployed URL
  if (isInFarcasterFrame()) {
    return process.env.NEXT_PUBLIC_URL || 'https://zerosum-arena.vercel.app';
  }
  
  // Otherwise use current origin
  return window.location.origin;
}

export function getGameUrl(gameId: number): string {
  return `${getAppUrl()}/battle/${gameId}`;
}

export function getWaitingRoomUrl(gameId: number): string {
  return `${getAppUrl()}/battle/waiting/${gameId}`;
}
