export default function Skeleton() {
  const itemStyle =
    'w-full h-full min-h-280 bg-gray-200 animate-pulse rounded-[20px]'
  return (
    <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-2 p-24 gap-24">
      <div className={itemStyle} />
      <div className={itemStyle} />
      <div className={itemStyle} />
      <div className={itemStyle} />
    </div>
  )
}
