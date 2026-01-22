const APPENDABLE_KEYS = [
  'title',
  'company',
  'jobTitle',
  'jobSpec',
  'idealTalent',
] as const

type AppendableKey = (typeof APPENDABLE_KEYS)[number]
type PayloadEntry = {
  key: AppendableKey
  payload:
    | { value: FormDataEntryValue | null }
    | { set: FormDataEntryValue | null }
} | null

/**
 *
 * Create 인터뷰용 payload 생성
 * @param {AppendableKey} key - AppendableKey의 key 중 하나
 * @param {FormData} formData - 원본 FormData
 * @returns { key, payload: {value: data} } or null - FormData에 값이 있으면 payload 반환, 없으면 null
 *
 */

function buildCreatePayload(
  key: AppendableKey,
  formData: FormData,
): PayloadEntry {
  const data = formData.get(key)
  if (data === null) return null

  return { key, payload: { value: data } }
}

/**
 * Update 인터뷰용 payload 생성
 * proxy 형식으로, interview를 주입받아 buildUpdatePayload 함수를 생성
 * @param {Interview} interview - 기존 인터뷰 데이터
 * @returns {(key: AppendableKey, formData: FormData) => PayloadEntry} - key와 formData를 받아 payload를 생성하는 함수
 */
function buildUpdatePayload(
  interview: Interview,
): (key: AppendableKey, formData: FormData) => PayloadEntry {
  return (key: AppendableKey, formData: FormData): PayloadEntry => {
    const data = formData.get(key)
    if (data === null) return null

    const oldData = interview[key]
    if (data === oldData) return null

    return { key, payload: { set: data } }
  }
}

/**
 * appendData를 만드는 함수
 * buildPayload 함수를 주입받아, APPENDABLE_KEYS를 순회하며 payload를 생성하고 newFormData에 append함
 * @param formData
 * @param newFormData
 * @param buildPayload
 */
function appendData(
  formData: FormData,
  newFormData: FormData,
  buildPayload: (key: AppendableKey, formData: FormData) => PayloadEntry,
) {
  const entries = APPENDABLE_KEYS.map((key) =>
    buildPayload(key, formData),
  ).filter((payload) => payload !== null)

  entries.forEach(({ key, payload }) => {
    newFormData.append(key, JSON.stringify(payload))
  })
}

/**
 * Create 인터뷰용 FormData를 생성하여 newFormData에 append함
 * @param formData - 원본 FormData
 * @param newFormData - 변환된 FormData
 */
export function appendCreateData(formData: FormData, newFormData: FormData) {
  appendData(formData, newFormData, buildCreatePayload)
}

/**
 * Update 인터뷰용 FormData를 생성하여 newFormData에 append함
 *
 * @param formData
 * @param newFormData
 * @param interview
 */
export function appendUpdateData(
  formData: FormData,
  newFormData: FormData,
  interview: Interview,
) {
  appendData(formData, newFormData, buildUpdatePayload(interview))
}

/**
 * 파일들을 newFormData에 append함
 * @param formData
 * @param newFormData
 */
export function appendFiles(formData: FormData, newFormData: FormData) {
  appendFile('coverLetter', formData, newFormData)
  appendFile('portfolio', formData, newFormData)
}

/**
 * 단일 파일을 newFormData에 append함
 * key에 해당하는 파일이 formData에 존재하고 size > 0인 경우에만 append
 * @param key
 * @param formatData
 * @param newFormData
 */
function appendFile(key: string, formData: FormData, newFormData: FormData) {
  const file = formData.get(key)
  if (file instanceof File && file.size > 0) {
    newFormData.append(key, file)
  }
}

/**
 * 인터뷰 Update(Patch)용 파일 처리
 *  1. 새로운 파일이 있으면 append
 *  2. 기존 파일이 있었는지 여부와 새로운 파일의 상태에 따라 Action 결정 후 append
 *  만약 이력서(coverLetter) 파일이 없거나 삭제 액션이면 오류 발생
 * @param formData
 * @param newFormData
 * @param interview
 */
export function appendUpdateFiles(
  formData: FormData,
  newFormData: FormData,
  interview: Interview,
) {
  appendUpdateCoverLetter(formData, newFormData, interview)
  appendUpdatePortfolio(formData, newFormData, interview)
}

/**
 * coverLetter(이력서) 파일 처리
 *
 * @param formData
 * @param newFormData
 * @param interview
 */
function appendUpdateCoverLetter(
  formData: FormData,
  newFormData: FormData,
  interview: Interview,
) {
  appendFile('coverLetter', formData, newFormData)

  if (!interview.coverLetterFilename) {
    throw new Error('서버에서 이력서 파일 정보를 찾을 수 없습니다.')
  }

  const coverLetterAction = resolveCoverLetterAction(
    formData.get('coverLetter'),
  )
  newFormData.append('coverLetterAction', coverLetterAction)
}

/**
 * portfolio(포트폴리오) 파일 처리
 *
 * @param formData
 * @param newFormData
 * @param interview
 */
function appendUpdatePortfolio(
  formData: FormData,
  newFormData: FormData,
  interview: Interview,
) {
  appendFile('portfolio', formData, newFormData)

  const portfolioAction = resolvePortfolioAction(
    formData.get('portfolio'),
    !!interview.portfolioFilename,
  )
  newFormData.append('portfolioAction', portfolioAction)
}

type FileAction = 'keep' | 'upload' | 'delete'

/**
 * coverLetter 파일 액션 결정
 * 새 파일 업로드: 'upload', 기존 파일 유지: 'keep', 삭제 시 오류 발생
 * @param file
 * @returns FileAction
 */
function resolveCoverLetterAction(file: FormDataEntryValue | null): FileAction {
  //새 파일 업로드
  if (file instanceof File && file.size > 0) return 'upload'
  // 기존 파일 유지 (placeholder)
  if (file instanceof File && file.size === 0) return 'keep'

  // 파일을 삭제했다면 오류 발생
  throw new Error('이력서(coverLetter) 파일은 반드시 존재해야 합니다.')
}

/**
 * portfolio 파일 액션 결정
 * 새 파일 업로드: 'upload', 기존 파일 유지: 'keep', 삭제: 'delete'
 * @param file
 * @param hasExistingFile
 * @returns FileAction
 */
function resolvePortfolioAction(
  file: FormDataEntryValue | null,
  hasExistingFile: boolean,
): FileAction {
  // 새 파일 업로드
  if (file instanceof File && file.size > 0) return 'upload'
  // 기존 파일 유지 (placeholder)
  if (file instanceof File && file.size === 0) return 'keep'
  // 파일이 없는데 기존에 있었으면 삭제
  if (hasExistingFile) return 'delete'
  // 기존에도 없었고 지금도 없음 - keep
  return 'keep'
}
