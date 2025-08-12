'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { io } from 'socket.io-client'

import { createInterview } from './action'
import { Label } from './component/Label'

export default function InterviewForm() {
  const router = useRouter()
  const [job, setJob] = useState('')
  const sessionIdRef = useRef<string | null>(null)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const sessionId = await createInterview(formData)
      sessionIdRef.current = sessionId

      // Clean up previous socket if exists
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      const socket = io('http://localhost:3000', {
        query: { sessionId },
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id)
      })

      socket.on('server:questions-ready', (data) => {
        console.log('Questions are ready:', data)
      })

      socket.emit('client:ready', () => {
        console.log('client ready')
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })
    } catch (error) {
      console.error('면접 생성 실패:', error)
    }
  }

  const card =
    'flex-1 h-full bg-bright rounded-[20px] shadow-box p-24 flex flex-col'

  return (
    <form className="w-full h-full flex gap-24" onSubmit={handleSubmit}>
      {/* 왼쪽 card
       직업, 회사명, 인재상을 입력함*/}
      <div className={`${card} justify-between gap-24`}>
        <Label text="Job">
          <select
            name="jobCategory"
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
      </div>

      {/* 오른쪽 카드 
      자기소개서, 포트폴리오를 입력받음*/}
      <div className={`${card} gap-24`}>
        <div className="flex-1 flex flex-col justify-between">
          <Label text="Resume">
            <input
              type="file"
              name="coverLetter"
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 hover:shadow-md"
            />
          </Label>
          <Label text="Portfolio">
            <input
              type="file"
              name="portfolio"
              className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100 hover:shadow-md"
            />
          </Label>
        </div>
        <div className="flex gap-24 h-48 flex-none">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-3 rounded-[10px] border border-dark text-dark hover:shadow-md hover:cursor-pointer"
          >
            back
          </button>
          <button
            type="submit"
            className="flex-7 rounded-[10px] bg-navy text-bright hover:shadow-xl hover:cursor-pointer"
          >
            create interview
          </button>
        </div>
      </div>
    </form>
  )
}
