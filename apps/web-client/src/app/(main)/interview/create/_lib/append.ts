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
  const coverLetter = formData.get('coverLetter')
  if (coverLetter instanceof File && coverLetter.size > 0) {
    newFormData.append('coverLetter', coverLetter)
  }

  const portfolio = formData.get('portfolio')
  if (portfolio instanceof File && portfolio.size > 0) {
    newFormData.append('portfolio', portfolio)
  }
}
