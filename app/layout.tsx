import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"

import { headers } from 'next/headers'
import { Providers } from "@/context/providers"
import { AppKit } from "@/context/appkit"
import NetworkStatus from "@/components/shared/NetworkStatus"
import { metadata } from "./metadata"

const inter = Inter({ subsets: ["latin"] })

export { metadata }

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <head>
        <meta name="farcaster:app" content="true" />
        <meta name="farcaster:app:name" content="ZeroSum Gaming Arena" />
        <meta name="farcaster:app:description" content="Mathematical warfare where strategy beats luck" />
        <meta name="farcaster:app:icon" content="https://zerosum-arena.vercel.app/og.png" />
        <meta name="farcaster:app:url" content="https://zerosum.arena" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZeroSum Gaming Arena" />
      </head>
      <body className={inter.className}>
        <AppKit>
          <Providers>
            {children}
            <NetworkStatus />
          </Providers>
        </AppKit>
      </body>
    </html>
  )
}
