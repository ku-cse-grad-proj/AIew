import Link from 'next/link'
import { Suspense } from 'react'

import Github from '../../../public/github.svg'
import Google from '../../../public/google.svg'

import LoginLink from './component/LoginLink'

export default function Login() {
  return (
    <div className="w-full h-dvh flex justify-center items-center">
      <div className="w-320 h-320 bg-neutral-card shadow-box rounded-[20px] flex flex-col justify-center items-center gap-48">
        <span className="text-4xl text-bold font-extrabold">welcome</span>
        <div className="flex flex-col items-center gap-24">
          <Suspense>
            <LoginLink text="Sign in with Google" link="google">
              <Google width={25} height={25} />
            </LoginLink>
            <LoginLink text="Sign in with Github" link="github">
              <Github width={25} height={25} />
            </LoginLink>
            <Link
              href={'/'}
              className="text-neutral-subtext inline-flex items-center gap-4"
            >
              cancel
            </Link>
          </Suspense>
        </div>
      </div>
    </div>
  )
}
