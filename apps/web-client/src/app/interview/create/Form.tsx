'use client'

import { useState, useRef } from 'react'
import { io } from 'socket.io-client'

import { createInterview } from './action'

export default function InterviewForm() {
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

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            직업 선택
          </label>
          <select
            name="jobCategory"
            value={job}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setJob(e.target.value)
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" hidden>
              선택하세요
            </option>
            <option value="web">Web developer</option>
            <option value="app">App developer</option>
          </select>
          <fieldset
            disabled={!job}
            className={`${!job ? 'opacity-50' : 'opacity-100'}`}
          >
            <select
              name="jobSpec"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" hidden>
                선택하세요
              </option>
              <option value="front">Frontend</option>
              <option value="back">Backend</option>
            </select>
          </fieldset>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            회사명
          </label>
          <input
            type="text"
            name="company"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="면접 제목을 입력하세요"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            인재상 입력
          </label>
          <textarea
            name="idealTalent"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="인재상에 대한 내용을 입력하세요"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            자기소개서
          </label>
          <input
            type="file"
            name="coverLetter"
            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            포트폴리오
          </label>
          <input
            type="file"
            name="portfolio"
            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          면접 생성
        </button>
      </form>
    </>
  )
}
