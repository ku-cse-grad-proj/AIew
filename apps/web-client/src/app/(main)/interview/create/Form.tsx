'use client'

import { useState, useRef } from 'react'

import Card from '../_components/Card'
import FooterButtons from '../_components/FooterButtons'

import { createInterview } from './action'
import DropzoneBox from './component/DropzoneBox'
import { Label } from './component/Label'

export default function InterviewForm() {
  const [job, setJob] = useState('')

  // Dropzone containers and selected files
  const resumeFileRef = useRef<File | null>(null)
  const portfolioFileRef = useRef<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (resumeFileRef.current)
      formData.append('coverLetter', resumeFileRef.current)
    if (portfolioFileRef.current)
      formData.append('portfolio', portfolioFileRef.current)
    try {
      await createInterview(formData)
    } catch (error) {
      console.error('면접 생성 실패:', error)
    }
  }

  return (
    <form
      className="w-full h-full flex flex-col lg:flex-row gap-24 m-auto"
      onSubmit={handleSubmit}
    >
      {/* 왼쪽 card
       직업, 회사명, 인재상을 입력함*/}
      <Card className="flex-1 flex flex-col justify-between">
        <Label text="Job">
          <select
            name="jobTitle"
            value={job}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setJob(e.target.value)
            }
            className="mt-1 block w-full h-48 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 hover:shadow-md"
          >
            <option value="" hidden>
              Select
            </option>
            <option value="web">Web developer</option>
            <option value="app">App developer</option>
          </select>
        </Label>
        <fieldset
          disabled={!job}
          className={`${!job ? 'opacity-50' : 'opacity-100'}`}
        >
          <Label text="Detail Job">
            <select
              name="jobSpec"
              className="mt-1 block w-full h-48 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 hover:shadow-md"
            >
              <option value="" hidden>
                Select
              </option>
              <option value="front">Frontend</option>
              <option value="back">Backend</option>
            </select>
          </Label>
        </fieldset>

        <Label text="Company Name">
          <input
            type="text"
            name="company"
            className="mt-1 block w-full h-48 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 hover:shadow-md"
            placeholder="Enter company name"
          />
        </Label>
        <Label text="Ideal Talent" className="basis-[40%] flex flex-col">
          <textarea
            name="idealTalent"
            className="mt-1 block w-full flex-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none hover:shadow-md"
            placeholder="Describe the ideal talent"
          ></textarea>
        </Label>
      </Card>

      {/* 오른쪽 카드 
      자기소개서, 포트폴리오를 입력받음*/}
      <Card className="flex-1 flex flex-col gap-24">
        <div className="flex-1 flex flex-col gap-24 ">
          <Label text="Resume" className="grow flex flex-col">
            <DropzoneBox fileRef={resumeFileRef} className="flex-1" />
          </Label>
          <Label text="Portfolio" className="grow flex flex-col">
            <DropzoneBox fileRef={portfolioFileRef} className="flex-1" />
          </Label>
        </div>
        <FooterButtons />
      </Card>
    </form>
  )
}
