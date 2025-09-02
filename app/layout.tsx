import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { headers } from 'next/headers'
import { AppKit } from "@/context/appkit"
import { Providers } from "@/context/providers"
import { MiniKitContextProvider } from "@/providers/MiniKitProvider"
import NetworkStatus from "@/components/shared/NetworkStatus"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "ZeroSum Gaming Arena - Mathematical Warfare",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Enter the arena where strategy beats luck. Mathematical warfare with hidden numbers and true fairness.",
    generator: 'v0.dev',
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'ZeroSum Arena'}`,
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'ZeroSum Arena',
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
      'fc:miniapp': JSON.stringify({
        version: '1',
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'ZeroSum Gaming Arena',
        icon: process.env.NEXT_PUBLIC_APP_ICON || `${URL}/placeholder-logo.png`,
        url: URL,
        description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Enter the arena where strategy beats luck. Mathematical warfare with hidden numbers and true fairness.',
      }),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={inter.className}>
        <MiniKitContextProvider>
          <AppKit>
            <Providers>
              {children}
              <NetworkStatus />
            </Providers>
          </AppKit>
        </MiniKitContextProvider>
      </body>
    </html>
  )
}
