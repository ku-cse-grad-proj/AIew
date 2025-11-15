import Card from '../../_components/Card'

export default function FormSkeleton() {
  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-24 m-auto">
      <Card className="flex-1 min-h-720 bg-neutral-card shadow-box rounded-[20px]">
        {''}
      </Card>
      <Card className="flex-1 min-h-720 bg-neutral-card shadow-box rounded-[20px]">
        {''}
      </Card>
    </div>
  )
}
