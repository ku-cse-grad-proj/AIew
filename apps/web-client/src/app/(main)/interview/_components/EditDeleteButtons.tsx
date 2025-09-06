'use client'

import Image from 'next/image'
import Link from 'next/link'
export default function EditDeleteButtons({
  id,
  onDeleteClick,
}: {
  id: string
  onDeleteClick: () => void
}) {
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
          onDeleteClick()
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
