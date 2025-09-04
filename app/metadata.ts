import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app-config";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Mathematical Warfare`,
  description: APP_CONFIG.tagline,
  generator: 'v0.dev',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_CONFIG.name
  },
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_CONFIG.url}${APP_CONFIG.ogImage}`,
      button: {
        title: APP_CONFIG.farcaster.frameTitle,
        action: {
          type: 'launch_frame',
          name: APP_CONFIG.farcaster.frameName,
          url: APP_CONFIG.url,
          splashImageUrl: `${APP_CONFIG.url}${APP_CONFIG.splashImage}`,
          splashBackgroundColor: APP_CONFIG.backgroundColor,
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: APP_CONFIG.themeColor,
};

// Re-export the centralized config
export { APP_CONFIG as appConfig };
