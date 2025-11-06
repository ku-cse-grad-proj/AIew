import CompanyGraph from './_components/CompanyGraph'
import RecentGraph from './_components/RecentGraph'
import RecentInterview from './_components/RecentInterview'
import RecentReports from './_components/RecentReports'
import UserInfos from './_components/UserInfos'

export default async function Dashboard() {
  const { userInfos, interview, reports } = await fetchDashboardData()
  return (
    <article className="w-full h-full flex flex-col min-h-0">
      <h1 className="text-[32px] font-bold leading-[48px]">
        {userInfos.name}'s Dashboard
      </h1>
      <div
        className="flex-1 w-full min-h-0 flex flex-col sm:grid sm:grid-cols-2 
       sm:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)_minmax(300px,auto)] 
       lg:grid-cols-3 lg:[grid-template-rows:minmax(300px,auto)_minmax(300px,auto)]
       gap-24 pt-24"
      >
        <UserInfos userInfos={userInfos} />
        <RecentInterview interview={interview} />
        <RecentReports
          reports={reports}
          className="bg-neutral-gray order-2 lg:order-none"
        />
        <RecentGraph className="lg:col-span-2 lg:row-start-2 row-start-3 col-span-2" />
        <CompanyGraph className="order-1 lg:order-none" />
      </div>
    </article>
  )
}

async function fetchDashboardData() {
  const reports = [
    {
      id: 1,
      title: 'Samsung AI Interview',
      jobTitle: 'Frontend',
      jobSpec: 'React',
      finishDate: '2025-11-01',
    },
    {
      id: 2,
      title: 'Naver Manager Interview',
      jobTitle: 'Manager',
      jobSpec: 'UX',
      finishDate: '2025-11-03',
    },
  ]

  const interview = {
    status: 'READY',
    title: '배달의 민족 interview',
    company: '배달의 민족',
    jobTitle: 'web',
    jobSpec: 'front',
  } as Interview

  const userInfos = {
    name: 'Lee Taeho',
    mostJobTitle: 'web',
    mostJobSpec: 'front',
    profileImg: '/profile.svg',
    interviewCount: 32,
    averageScore: 3.2,
  }

  await new Promise((r) => setTimeout(r, 1000))
  return { reports, interview, userInfos }
}
