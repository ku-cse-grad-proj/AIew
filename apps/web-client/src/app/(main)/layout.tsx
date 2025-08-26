import { ReactNode } from 'react'

import Header from './_components/Header'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const mainBackground =
    'bg-slate-400/20 rounded-[20px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.07)] border border-white/40'
  return (
    <div className="w-full h-dvh flex flex-col">
      <Header />
      <main className={`flex-1 w-full max-w-1296 mx-auto px-24 pb-24`}>
        <div className={`w-full h-full ${mainBackground}`}>{children}</div>
      </main>
    </div>
  )
}
