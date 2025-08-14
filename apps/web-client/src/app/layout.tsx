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
  const mainBackground =
    'bg-slate-400/20 rounded-[20px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.07)] border border-white/40'
  return (
    <html lang="en" className={`${pretendard.variable}`}>
      <body
        className={`${pretendard.className} ${background} h-screen flex flex-col`}
      >
        <header className="w-full max-w-1248 mx-auto h-96 flex justify-between items-center p-24">
          <span>AIew</span>
          <nav>dashboard interview setting</nav>
          <img src="/profile.svg" alt="profile" />
        </header>
        <main className={`flex-1 w-full max-w-1296 mx-auto px-24 pb-24`}>
          <div className={`w-full h-full ${mainBackground}`}>{children}</div>
        </main>
      </body>
    </html>
  )
}
