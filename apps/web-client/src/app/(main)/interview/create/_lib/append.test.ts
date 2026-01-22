import { describe, it, expect } from 'vitest'

import { appendCreateData, appendUpdateData, appendUpdateFiles } from './append'

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

describe('coverLetter file append', () => {
  it('converLetter가 변경되지 않으면 newFormData의 coverLetterAction은 "keep"으로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    const emptyFile = new File([''], 'empty.pdf', {
      type: 'application/pdf',
    })

    formData.append('coverLetter', emptyFile)

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // portfolio는 size 0이라 없어야 함
    expect(entries.find(([key]) => key === 'coverLetterAction')).toEqual([
      'coverLetterAction',
      'keep',
    ])
  })

  it('새로운 coverLetter가 있으면 append되고 coverLetterAction은 "upload"으로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    const newFile = new File(['%PDF-1.4'], 'new.pdf', {
      type: 'application/pdf',
    })

    formData.append('coverLetter', newFile)

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // coverLetter가 append되어야 함
    expect(entries.find(([key]) => key === 'coverLetter')).toBeTruthy()
    // coverLetterAction은 'upload'여야 함
    expect(entries.find(([key]) => key === 'coverLetterAction')).toEqual([
      'coverLetterAction',
      'upload',
    ])
  })

  it('coverLetter가 삭제 액션이면 오류가 발생한다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    // coverLetter 삭제 액션일 때
    formData.append('coverLetter', '') // 빈 값으로 삭제 시도

    const newFormData2 = new FormData()
    expect(() =>
      appendUpdateFiles(formData, newFormData2, interview),
    ).toThrowError('이력서(coverLetter) 파일은 반드시 존재해야 합니다.')
  })

  it('coverLetter 파일 정보가 없으면 오류가 발생한다', () => {
    const interview = {
      // coverLetterFilename이 없음
    } as unknown as Interview
    const formData = new FormData()

    const newFormData = new FormData()
    expect(() =>
      appendUpdateFiles(formData, newFormData, interview),
    ).toThrowError('서버에서 이력서 파일 정보를 찾을 수 없습니다.')
  })
})

describe('portfolio file append', () => {
  it('portfolio가 변경되지 않으면(size가 0) newFormData의 portfolioAction은 "keep"으로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    const emptyFile = new File([''], 'empty.pdf', {
      type: 'application/pdf',
    })

    formData.append(
      'coverLetter',
      new File([''], 'new.pdf', {
        type: 'application/pdf',
      }),
    )

    formData.append('portfolio', emptyFile)

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // portfolioAction은 'keep'이어야 함
    expect(entries.find(([key]) => key === 'portfolioAction')).toEqual([
      'portfolioAction',
      'keep',
    ])
  })

  it('새로운 portfolio가 있으면 append되고 portfolioAction은 "upload"으로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    formData.append(
      'coverLetter',
      new File([''], 'new.pdf', {
        type: 'application/pdf',
      }),
    )

    const newFile = new File(['%PDF-1.4'], 'new_portfolio.pdf', {
      type: 'application/pdf',
    })

    formData.append('portfolio', newFile)

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })
    // portfolio가 append되어야 함
    expect(entries.find(([key]) => key === 'portfolio')).toBeTruthy()
    // portfolioAction은 'upload'여야 함
    expect(entries.find(([key]) => key === 'portfolioAction')).toEqual([
      'portfolioAction',
      'upload',
    ])
  })

  it('portfolio가 삭제되면 portfolioAction은 "delete"로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    //portfolio name 있음 → 기존에 파일이 존재함을 의미
    interview.portfolioFilename = 'old_portfolio.pdf'

    formData.append(
      'coverLetter',
      new File([''], 'new.pdf', {
        type: 'application/pdf',
      }),
    )

    // portfolio 삭제 액션일 때
    formData.append('portfolio', '') // 빈 값으로 삭제 시도

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // portfolioAction은 'delete'이어야 함
    expect(entries.find(([key]) => key === 'portfolioAction')).toEqual([
      'portfolioAction',
      'delete',
    ])
  })

  it('interview의 portfolioFilename이 없고 formData에도 portfolio가 없으면 portfolioAction은 "keep"으로 설정된다', () => {
    const interview = getCoverLetterInterview()
    const formData = new FormData()

    //portfolio name 없음 → 기존에 파일이 존재하지 않음을 의미
    interview.portfolioFilename = undefined

    formData.append(
      'coverLetter',
      new File([''], 'new.pdf', {
        type: 'application/pdf',
      }),
    )

    // portfolio를 아예 추가하지 않음

    const newFormData = new FormData()
    appendUpdateFiles(formData, newFormData, interview)

    const entries: [string, FormDataEntryValue][] = []
    newFormData.forEach((value, key) => {
      entries.push([key, value])
    })

    // portfolioAction은 'keep'이어야 함
    expect(entries.find(([key]) => key === 'portfolioAction')).toEqual([
      'portfolioAction',
      'keep',
    ])
  })
})

function getCoverLetterInterview(): Interview {
  return {
    id: '',
    title: '',
    company: '',
    jobTitle: '',
    jobSpec: '',
    status: 'PENDING',
    currentQuestionIndex: 0,
    idealTalent: '',
    coverLetterFilename: 'old_coverLetter.pdf',
    createdAt: '',
    updatedAt: '',
  }
}
