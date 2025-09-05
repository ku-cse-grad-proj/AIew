'use client'
export default function Button({ disabled, children, onClick, className }) {
  return (
    <button
      disabled={disabled}
      className={`bg-gray-800 text-white rounded-full p-4 flex items-center gap-1 hover:opacity-90 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
