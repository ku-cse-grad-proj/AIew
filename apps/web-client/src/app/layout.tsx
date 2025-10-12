import type { Metadata } from 'next'
import './globals.css'
import localFont from 'next/font/local'
import { PublicEnvScript } from 'next-runtime-env'

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard',
})

export const metadata: Metadata = {
  title: 'AIew',
  description: 'AI interview practice application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${pretendard.variable}`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className={`${pretendard.className}`}>{children}</body>
    </html>
  )
}
