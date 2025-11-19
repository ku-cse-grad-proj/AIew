import { describe, it, expect } from 'vitest'

import { appendCreateData, appendUpdateData, appendFiles } from './append'

// FormData 내용을 보기 좋게 배열로 변환하는 헬퍼
function formDataEntries(fd: FormData): [string, string][] {
  const result: [string, string][] = []
  fd.forEach((value, key) => {
    result.push([key, String(value)])
  })
  return result
}

describe('appendCreateData', () => {
  it('FormData에 있는 값만 `{ value }` payload로 append한다', () => {
    const formData = new FormData()
    formData.append('title', '제목')
    formData.append('company', '토스')
    // jobTitle, jobSpec, idealTalent는 비워둠

    const newFormData = new FormData()

    appendCreateData(formData, newFormData)

    const entries = formDataEntries(newFormData)

    expect(entries).toContainEqual(['title', JSON.stringify({ value: '제목' })])
    expect(entries).toContainEqual([
      'company',
      JSON.stringify({ value: '토스' }),
    ])
    // 넣지 않은 key는 없어야 함
    expect(entries.find(([key]) => key === 'jobTitle')).toBeUndefined()
    expect(entries.find(([key]) => key === 'jobSpec')).toBeUndefined()
    expect(entries.find(([key]) => key === 'idealTalent')).toBeUndefined()
  })

  it('APPENDABLE_KEYS에 없는 key는 무시된다', () => {
    const formData = new FormData()
    formData.append('notAllowedKey', 'foo')

    const newFormData = new FormData()
    appendCreateData(formData, newFormData)

    const entries = formDataEntries(newFormData)

    expect(entries.length).toBe(0)
  })
})

describe('appendUpdateData', () => {
  const baseInterview = {
    title: '기존 제목',
    company: '토스',
    jobTitle: 'FE',
    jobSpec: 'Frontend',
    idealTalent: '책임감 있는 사람',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any // 타입 귀찮으면 any로 캐스팅

  it('기존 값과 동일하면 append하지 않는다', () => {
    const formData = new FormData()
    formData.append('company', '토스') // 기존과 동일
    formData.append('title', '기존 제목') // 동일

    const newFormData = new FormData()
    appendUpdateData(formData, newFormData, baseInterview)

    const entries = formDataEntries(newFormData)
    expect(entries.length).toBe(0)
  })

  it('변경된 값만 `{ set }` payload로 append된다', () => {
    const formData = new FormData()
    formData.append('company', '네이버') // 변경
    formData.append('jobTitle', 'BE') // 변경
    formData.append('title', '기존 제목') // 동일 → 무시

    const newFormData = new FormData()
    appendUpdateData(formData, newFormData, baseInterview)

    const entries = formDataEntries(newFormData)

    expect(entries).toContainEqual([
      'company',
      JSON.stringify({ set: '네이버' }),
    ])
    expect(entries).toContainEqual(['jobTitle', JSON.stringify({ set: 'BE' })])
    // title은 기존과 동일하므로 없어야 함
    expect(entries.find(([key]) => key === 'title')).toBeUndefined()
  })
})

describe('appendFiles', () => {
  it('size가 0보다 큰 File만 append한다', () => {
    const formData = new FormData()

    const nonEmptyFile = new File(['%PDF-1.4'], 'hello.pdf', {
      type: 'application/pdf',
    })
    const emptyFile = new File([''], 'empty.pdf', {
      type: 'application/pdf',
    })

    formData.append('coverLetter', nonEmptyFile)
    formData.append('portfolio', emptyFile)

    const newFormData = new FormData()
    appendFiles(formData, newFormData)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // coverLetter는 들어와야 함
    expect(entries.find(([key]) => key === 'coverLetter')).toBeTruthy()
    // portfolio는 size 0이라 없어야 함
    expect(entries.find(([key]) => key === 'portfolio')).toBeUndefined()
  })
})
