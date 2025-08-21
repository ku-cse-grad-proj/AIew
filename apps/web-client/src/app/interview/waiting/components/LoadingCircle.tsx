export default function LoadingCircle() {
  return (
    <div className="flex items-center justify-center">
      {/* Outer halo (subtle) */}
      <div className="absolute w-200 h-200 rounded-full bg-base/30 blur-[1px] animate-breath-calm" />
      {/* Core */}
      <div className="relative w-176 h-176 rounded-full bg-base animate-breath-delay-calm" />
    </div>
  )
}
