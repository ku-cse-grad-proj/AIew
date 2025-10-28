// import styles from './table.module.css'

// import Dots from '@/../public/icons/dots.svg'

export default function TableBodySkeleton() {
  return (
    <div className="flex-1 w-full min-h-0 flex flex-col justify-around px-8 overflow-y-auto">
      {Array.from({ length: 10 }, (_, i) => i).map((i) => (
        <div
          key={i}
          className="w-full min-h-40 py-8 bg-gray-200 animate-pulse rounded-[10px]"
        ></div>
      ))}
    </div>
  )
}
