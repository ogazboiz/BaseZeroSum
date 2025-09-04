import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { headers } from 'next/headers'
import { Providers } from "@/context/providers"
import NetworkStatus from "@/components/shared/NetworkStatus"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ZeroSum Gaming Arena - Mathematical Warfare",
  description: "Enter the arena where strategy beats luck. Mathematical warfare with hidden numbers and true fairness.",
    generator: 'v0.dev'
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
        <Providers>
          {children}
          <NetworkStatus />
        </Providers>
      </body>
    </html>
  )
}
