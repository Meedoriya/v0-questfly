import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Unbounded } from 'next/font/google'

import './globals.css'

// Body: clean, geometric, highly legible on small screens.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// Display: bold, circular, game-like — used for hero headings, XP numbers, celebrations.
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'QuestForge - Turn Goals Into Quests',
  description: 'AI-powered goal tracking app that gamifies your personal growth journey with quests, XP, and streaks.',
}

export const viewport: Viewport = {
  themeColor: '#141822',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${unbounded.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
