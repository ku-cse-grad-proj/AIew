import Image from 'next/image'

import styles from './dashboard.module.css'
import InfoCard from './InfoCard'

export default function UserInfos({ className }: { className?: string }) {
  return (
    <section
      className={`w-full h-full grid grid-cols-2 grid-rows-2 items-stretch gap-24 ${className}`}
    >
      <h3 className="sr-only">user informations</h3>
      <div className={`h-full col-span-2 bg-neutral-card flex  ${styles.card}`}>
        <div className="min-w-0 flex-3 relative w-full h-full">
          <Image
            src={'/profile.svg'}
            fill
            alt={'profile image'}
            className="p-12 lg:p-24"
          />
        </div>
        <div className="flex-5 h-full flex flex-col justify-center gap-4 p-8">
          <p className="font-bold text-[20px]">Lee Taeho</p>
          <p className="font-medium text-[18px] text-neutral-subtext">
            frontend
          </p>
        </div>
      </div>
      <InfoCard
        title="interview count"
        description="32"
        className="bg-neutral-gray"
      />
      <InfoCard
        title="average score"
        description="8.2"
        className="bg-secondary text-neutral-card"
      />
    </section>
  )
}
