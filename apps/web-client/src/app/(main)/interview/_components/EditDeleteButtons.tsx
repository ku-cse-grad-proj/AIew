'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { env } from 'next-runtime-env'

import { privateFetch } from '@/app/lib/fetch'
export default function EditDeleteButtons({
  id,
  onDeleteClick,
}: {
  id: string
  onDeleteClick?: (id?: string) => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const handleDelete = async () => {
    //TODO:: 추후 커스텀한 modal 창 생성
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const CORE_API_URL = env('NEXT_PUBLIC_CORE_API_URL')
      const API_PREFIX = env('NEXT_PUBLIC_API_PREFIX')
      const res = await privateFetch(
        `${CORE_API_URL}/${API_PREFIX}/interviews/${id}`,
        {
          method: 'DELETE',
        },
      )

      if (res.ok) {
        // 부모로 삭제 이벤트 전달
        onDeleteClick?.(id)

        //만약 interview page가 아니라면 interview page로 redirect
        console.log(pathname)
        if (pathname !== '/interview') router.replace('/interview')
      } else {
        console.error('Failed to delete interview:', await res.text())
      }
    } catch (err) {
      console.error('Error deleting interview:', err)
    }
  }
  return (
    <>
      <Link
        type="button"
        className="px-10 text-neutral-subtext flex items-center justify-center gap-6 z-10"
        href={`/interview/create/${id}`}
      >
        <Image src="/icons/edit.svg" alt="edit icon" width={12} height={12} />
        edit
      </Link>

      <button
        type="button"
        className="px-10 text-error flex items-center justify-center gap-6 z-10"
        onClick={(e) => {
          e.preventDefault()
          handleDelete()
        }}
      >
        <Image
          src="/icons/delete.svg"
          alt="delete icon"
          width={12}
          height={12}
        />
        delete
      </button>
    </>
  )
}
