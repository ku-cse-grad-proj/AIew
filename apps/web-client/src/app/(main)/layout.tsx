import { ReactNode } from 'react'

import Header from './_components/Header'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="w-full h-dvh flex flex-col">
      <Header />
      <main className={`flex-1 w-full max-w-1296 mx-auto px-24 pb-24`}>
        <div className={`w-full h-full`}>{children}</div>
      </main>
    </div>
  )
}
