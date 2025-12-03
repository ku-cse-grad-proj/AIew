import { ReactNode } from 'react'

export default function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="w-full h-full max-w-360 max-h-360 bg-neutral-background rounded-[20px] flex flex-col items-center justify-center px-24">
        {children}
      </div>
    </div>
  )
}
