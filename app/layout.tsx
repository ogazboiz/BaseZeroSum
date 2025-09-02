import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { headers } from 'next/headers'
import { AppKit } from "@/context/appkit"
import { Providers } from "@/context/providers"
import { MiniKitContextProvider } from "@/providers/MiniKitProvider"
import NetworkStatus from "@/components/shared/NetworkStatus"
import config from '@/config.json'

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return {
    title: `${config.app.name} - ${config.app.subtitle}`,
    description: config.app.description,
    generator: 'v0.dev',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: config.app.heroImage,
        button: {
          title: `Launch ${config.app.name}`,
          action: {
            type: 'launch_frame',
            name: config.app.name,
            url: URL,
            splashImageUrl: config.app.splashImage,
            splashBackgroundColor: config.app.splashBackgroundColor,
          },
        },
      }),
      'fc:miniapp': JSON.stringify({
        version: '1',
        name: config.app.name,
        icon: config.app.icon,
        url: URL,
        description: config.app.description,
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
