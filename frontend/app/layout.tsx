import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Load the Inter font from Google Fonts
// Next.js automatically optimizes fonts (no layout shift, no extra network requests)
const inter = Inter({ subsets: ['latin'] })

// Metadata appears in the browser tab and search engine results
export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'Manage and assign tasks with your team',
}

// RootLayout wraps everything — it runs on EVERY page
export default function RootLayout({
  children,         // 'children' is the page content that gets inserted here
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* children is replaced with the actual page component */}
        {children}
      </body>
    </html>
  )
}