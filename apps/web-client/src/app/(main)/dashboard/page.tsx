import styles from './_components/dashboard.module.css'
import CardSection from './CardSection'

export default function Dashboard() {
  return (
    <article className="w-full h-full flex flex-col">
      <h1 className="text-[32px] font-bold leading-[48px]">
        Taeho's Dashboard
      </h1>
      <div className="flex-1 w-full min-h-0 grid grid-cols-2 grid-rows-3 lg:grid-cols-3 lg:grid-rows-2 gap-24 pt-24">
        <section className="w-full h-full grid grid-cols-2 grid-rows-2 gap-24">
          <div className={`h-full col-span-2 ${styles.card}`}>name</div>
          <div className={`h-full  bg-neutral-gray ${styles.card}`}>
            interviewed count
          </div>
          <div className={`h-full ${styles.card} bg-secondary`}>user info</div>
        </section>
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
