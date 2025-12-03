import Logo from '@/app/_components/Logo'

export default function Loading() {
  return (
    <div className="w-full min-h-dvh min-h-500 flex flex-col items-center justify-center">
      <div className="w-full max-w-1248 flex-1 min-h-500 p-24 flex flex-col gap-24">
        <Logo />
        <div className="w-full flex-1 min-h-500 flex items-center justify-center">
          <div className="w-full flex-1 min-h-500 max-h-452 bg-neutral-card rounded-[20px] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
