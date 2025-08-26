'use client'

import Dropzone from 'dropzone'
import { useEffect, useRef } from 'react'

export type DropzoneBoxProps = {
  /** 외부에서 전달한 파일 저장용 ref (Form 제출 시 사용) */
  fileRef: React.RefObject<File | null>
  /** 허용할 파일 확장자 (Dropzone 형식) */
  accept?: string
  /** 최대 업로드 파일 수 */
  maxFiles?: number
  /** Tailwind 등 추가 클래스 */
  className?: string
  /** 안내 문구 */
  message?: string
}

/** Reusable Dropzone.js wrapper (no auto upload; store file to ref) */
export default function DropzoneBox({
  fileRef,
  accept = '.pdf',
  maxFiles = 1,
  className = '',
  message = 'Drag & drop PDF here, or click to select',
}: DropzoneBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const previewTemplate = `
  <div class="flex items-center gap-3 p-8 border border-gray-300 rounded-md bg-white">
    <img data-dz-thumbnail class="w-16 h-16 object-cover rounded" />
    <div class="flex flex-col text-sm">
      <span data-dz-name class="font-medium"></span>
      <span data-dz-size class="text-gray-500 text-xs"></span>
    </div>
    <button data-dz-remove class="ml-auto text-red-500 hover:text-red-700">Remove</button>
  </div>
`

  useEffect(() => {
    Dropzone.autoDiscover = false
    const el = containerRef.current
    if (!el) return

    const dz = new Dropzone(el, {
      url: '/', // auto upload 안 하므로 의미 없음
      autoProcessQueue: false,
      maxFiles,
      maxFilesize: 5,
      acceptedFiles: accept,
      // addRemoveLinks: true,
      clickable: true,
      previewTemplate,
      dictDefaultMessage: message,
    })

    dz.on('addedfile', (file: File) => {
      fileRef.current = file
    })
    dz.on('removedfile', () => {
      fileRef.current = null
    })

    return () => {
      try {
        dz.destroy()
      } catch {}
    }
  }, [accept, maxFiles, message, fileRef])

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center rounded-md border-black border-1 border-dashed text-black text-sm hover:cursor-pointer ${className}`}
    >
      {message}
    </div>
  )
}
