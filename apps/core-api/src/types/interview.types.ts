export interface InterviewRequestBody {
  company: { value: string }
  jobTitle: { value: string }
  jobSpec: { value: string }
  idealTalent: { value: string }
}

/** 파일 액션 타입: keep(유지), upload(새 파일 업로드), delete(삭제) */
export type FileAction = 'keep' | 'upload' | 'delete'

/** 파일별 액션 정의 */
export interface FileActions {
  coverLetter: FileAction
  portfolio: FileAction
}
