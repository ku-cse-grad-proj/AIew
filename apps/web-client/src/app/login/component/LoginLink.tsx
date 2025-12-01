import Link from 'next/link'
import { connection } from 'next/server'

interface LoginButtonProps {
  text: string
  children: React.ReactNode
  link: string
}

export default async function LoginLink({
  text,
  children,
  link,
}: LoginButtonProps) {
  await connection()

  const { API_BASE_URL, API_PREFIX } = process.env
  return (
    <Link
      className="w-240 h-48 px-3 py-[10px] bg-gray-200 rounded-2xl
         inline-flex justify-center items-center gap-8
         shadow-box
        hover:shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] hover:backdrop-blur-[20px]
        transition-all duration-300 ease-in-out"
      type="button"
      href={`${API_BASE_URL}/${API_PREFIX}/oauth2/${link}`}
    >
      {children}
      <span className="w-[140px]">{text}</span>
    </Link>
  )
}
