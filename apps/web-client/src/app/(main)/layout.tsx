import { ReactNode } from 'react'

import Header from './_components/Header'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="w-full h-dvh flex flex-col">
      <Header />
      <main className={`flex-1 min-h-0 w-full max-w-1248 mx-auto px-24 pb-24`}>
        {children}
      </main>
    </div>
  )
}
