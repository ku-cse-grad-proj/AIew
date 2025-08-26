import type { Metadata } from 'next'
import './globals.css'
import localFont from 'next/font/local'

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
  const background =
    'bg-[linear-gradient(109.6deg,rgba(204,228,247,1)_11.2%,rgba(237,246,250,1)_100.2%)]'

  return (
    <html lang="en" className={`${pretendard.variable}`}>
      <body className={`${pretendard.className} ${background} h-dvh w-full`}>
        {children}
      </body>
    </html>
  )
}
