import UserInfos from './_components/UserInfos'
import CardSection from './CardSection'

export default function Dashboard() {
  return (
    <article className="w-full h-full flex flex-col min-h-0">
      <h1 className="text-[32px] font-bold leading-[48px]">
        Taeho's Dashboard
      </h1>
      <div
        className="flex-1 w-full min-h-0 flex flex-col sm:grid sm:grid-cols-2 
       sm:[grid-template-rows:minmax(18rem,auto)_minmax(18rem,auto)_minmax(18rem,auto)] 
       lg:grid-cols-3 lg:grid-rows-2 gap-24 pt-24"
      >
        <UserInfos />
        <CardSection className="">recent interview</CardSection>
        <CardSection className="bg-neutral-gray order-2 lg:order-none">
          recent reports
        </CardSection>
        <CardSection className="lg:col-span-2 lg:row-start-2 row-start-3 col-span-2">
          recent's result
        </CardSection>
        <CardSection className="order-1 lg:order-none">
          interviewed company
        </CardSection>
      </div>
    </article>
  )
}
