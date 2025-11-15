import { Suspense } from 'react'

import Github from '../../../public/github.svg'
import Google from '../../../public/google.svg'

import LoginButton from './component/LoginButton'

export default function Login() {
  return (
    <div className="h-full flex flex-col justify-center items-center gap-48">
      <span className="text-4xl text-bold font-extrabold">welcome</span>
      <div className="flex flex-col gap-24">
        <Suspense>
          <LoginButton text="Sign in with Google" link="google">
            <Google width={25} height={25} />
          </LoginButton>
          <LoginButton text="Sign in with Github" link="github">
            <Github width={25} height={25} />
          </LoginButton>
        </Suspense>
      </div>
    </div>
  )
}
