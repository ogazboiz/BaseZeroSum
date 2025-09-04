import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app-config";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Mathematical Warfare`,
  description: APP_CONFIG.tagline,
  generator: 'v0.dev',
  manifest: '/manifest.json',
  themeColor: APP_CONFIG.themeColor,
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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

// Re-export the centralized config
export { APP_CONFIG as appConfig };
