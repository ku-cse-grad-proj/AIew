'use client'

import useDropzoneBox from '@/app/hooks/useDropzoneBox'

export type DropzoneBoxProps = {
  /** 외부에서 전달한 파일 저장용 ref (Form 제출 시 사용) */
  fileRef: React.RefObject<File | null>
  /** 허용할 파일 MIME/accept 값 (기본: PDF) */
  accept?: string
  /** 최대 업로드 파일 수 (현재 컴포넌트는 1개만 지원; 향후 확장 대비) */
  maxFiles?: number
  /** Tailwind 등 추가 클래스 */
  className?: string
  /** 안내 문구 */
  message?: string
  /** 허용 최대 용량(MB) */
  maxSizeMB?: number
}

export default function DropzoneBox({
  fileRef,
  accept = 'application/pdf',
  maxFiles = 1,
  className = '',
  message = 'Drag & drop PDF here, or click to select',
  maxSizeMB = 10,
}: DropzoneBoxProps) {
  const {
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
  } = useDropzoneBox({ fileRef, accept, maxFiles, maxSizeMB })

  return (
    <div className={`flex flex-col gap-12 h-full ${className}`}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
      />
      <label
        ref={containerRef}
        role="button"
        tabIndex={0}
        htmlFor={inputId}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col flex-1 items-center justify-center rounded-md border border-dashed text-sm hover:cursor-pointer transition-colors p-24 min-h-120 ${
          dragActive
            ? 'bg-gray-50 border-blue-500'
            : 'bg-neutral-card border-black/60'
        }`}
        aria-label={message}
      >
        {!file ? (
          <span className="text-center">{message}</span>
        ) : (
          <FilePreview file={file} onRemove={reset} />
        )}
      </label>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}

type FilePreviewProps = {
  file: File
  onRemove: (e: React.MouseEvent) => void
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  return (
    <div className="flex items-center gap-12 w-full">
      <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs">
        PDF
      </div>
      <div className="flex flex-col text-sm overflow-hidden">
        <span className="font-medium truncate" title={file.name}>
          {file.name}
        </span>
        <span className="text-gray-500 text-xs">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto text-red-500 hover:text-red-700 text-sm"
      >
        Remove
      </button>
    </div>
  )
}
