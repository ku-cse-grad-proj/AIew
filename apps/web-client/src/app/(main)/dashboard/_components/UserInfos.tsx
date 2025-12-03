import { getUser } from '../../_lib/api'
import { getDashboard } from '../_lib/api'

import styles from './dashboard.module.css'
import InfoCard from './InfoCard'

import CircleProfile from '@/app/_components/CircleProfile'

type UserInfos = {
  name: string
  mostJobTitle: string
  mostJobSpec: string
  profileImg: string
  interviewCount: number
  averageScore: number
}

export default async function UserInfos({ className }: { className?: string }) {
  const { userInfos }: { userInfos: UserInfos } = await getDashboard()
  const { updatedAt } = await getUser()
  const {
    name,
    mostJobTitle,
    mostJobSpec,
    profileImg,
    interviewCount,
    averageScore,
  } = userInfos

  return (
    <section
      className={`w-full h-full grid grid-cols-2 grid-rows-2 items-stretch gap-24 ${className}`}
    >
      <h3 className="sr-only">user informations</h3>

      <div
        className={`h-full p-16 gap-16 col-span-2 bg-neutral-card flex ${styles.card}`}
      >
        <CircleProfile
          src={profileImg}
          updatedAt={updatedAt}
          name={name}
          className="flex-3 max-w-[80px] lg:max-w-[100px] self-center"
        />
        <div className="flex-5 h-full flex flex-col justify-center gap-4 p-8">
          <p className="font-bold text-[20px]">{name}</p>
          <p className="font-medium text-[18px] text-neutral-subtext">
            {mostJobTitle} {'>'} {mostJobSpec}
          </p>
        </div>
      </div>

      <InfoCard
        title="interview count"
        description={String(interviewCount)}
        className="bg-neutral-gray"
      />
      <InfoCard
        title="average score"
        description={String(averageScore)}
        className="bg-secondary text-neutral-card"
      />
    </section>
  )
}
