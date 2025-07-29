import DashboardHeader from './_component/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-dvh bg-gradient-to-br from-blue-800 to-teal-600/80 flex items-center justify-center flex-col">
      <DashboardHeader />
      {children}
    </div>
  )
}
