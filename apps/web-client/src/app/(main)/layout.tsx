import { ReactNode } from 'react'

import Header from './_components/Header'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="w-full min-h-dvh flex flex-col items-center">
      <Header />
      <main
        className={`w-full flex-1 min-h-0 max-w-1248 px-16 sm:px-24 pb-24 flex flex-col`}
      >
        {children}
      </main>
    </div>
  )
}
