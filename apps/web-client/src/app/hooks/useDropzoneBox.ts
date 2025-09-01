'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type UseDropzoneBoxOptions = {
  /** 외부에서 전달한 파일 저장용 ref (Form 제출 시 사용) */
  fileRef?: React.RefObject<File | null>
  /** 허용할 파일 MIME/accept 값 (기본: PDF) */
  accept?: string
  /** 최대 업로드 파일 수 (현재는 1개만 지원; 향후 확장 대비) */
  maxFiles?: number
  /** 허용 최대 용량(MB) */
  maxSizeMB?: number
}

export type UseDropzoneBoxReturn = {
  inputId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  containerRef: React.RefObject<HTMLLabelElement | null>
  dragActive: boolean
  file: File | null
  error: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDragEnter: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  reset: (e: React.MouseEvent) => void
}

export default function useDropzoneBox({
  fileRef,
  accept = 'application/pdf',
  maxFiles = 1,
  maxSizeMB = 10,
}: UseDropzoneBoxOptions = {}): UseDropzoneBoxReturn {
  const containerRef = useRef<HTMLLabelElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()

  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')

  // keep external ref in sync
  useEffect(() => {
    if (fileRef) fileRef.current = file
  }, [file, fileRef])

  const reset = useCallback((e: React.MouseEvent) => {
    setFile(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validate = useCallback(
    (f: File): string | null => {
      if (!f) return '파일을 찾을 수 없습니다.'
      // 타입 체크: 일부 브라우저는 PDF 드롭 시 type이 빈 문자열일 수 있어 확장자도 체크
      const isPdfMime = f.type === 'application/pdf'
      const isPdfExt = /\.pdf$/i.test(f.name)
      // accept가 커스텀으로 들어온 경우, 간단히 포함 여부만 확인 (확장 가능)
      const acceptOk = accept
        ? accept.includes('pdf')
          ? isPdfMime || isPdfExt
          : true
        : true
      if (!acceptOk) return '허용되지 않는 파일 형식입니다.'
      if (!(isPdfMime || isPdfExt)) return 'PDF 파일만 업로드할 수 있습니다.'
      if (f.size > maxSizeMB * 1024 * 1024)
        return `파일 크기가 ${maxSizeMB}MB를 초과했습니다.`
      return null
    },
    [accept, maxSizeMB],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      if (maxFiles !== 1) {
        // 현재 UI는 단일 파일용. 필요 시 다중 미리보기로 확장 가능.
      }
      const f = files[0]
      const v = validate(f)
      if (v) {
        setError(v)
        return
      }
      setError('')
      setFile(f)
    },
    [maxFiles, validate],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles],
  )

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!dragActive) setDragActive(true)
    },
    [dragActive],
  )

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 드래그가 컨테이너 바깥으로 완전히 나간 경우만 비활성화
    if (e.currentTarget === e.target) setDragActive(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer?.files ?? null)
    },
    [handleFiles],
  )

  return {
    inputId,
    inputRef,
    containerRef,
    dragActive,
    file,
    error,
    onInputChange,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    reset,
  }
}
