import Github from '../../../public/github.svg'
import Google from '../../../public/google.svg'

import LoginButton from './component/LoginButton'

export default function Login() {
  return (
    <div className="w-full h-dvh bg-gradient-to-br from-blue-800 to-teal-600/80 flex items-center justify-center">
      <div
        className="w-100 h-100 flex flex-col items-center justify-center
      bg-white/5 rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] border border-white/20 gap-20"
      >
        <span className="text-4xl text-bold font-extrabold">welcome</span>
        <div className="flex flex-col gap-5">
          <LoginButton text="Sign in with Google" link="google">
            <Google width={25} height={25} />
          </LoginButton>
          <LoginButton text="Sign in with Github" link="github">
            <Github width={25} height={25} />
          </LoginButton>
        </div>
      </div>
    </div>
  )
}
