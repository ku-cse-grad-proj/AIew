import { updateTag } from 'next/cache'

import { getInterview } from './_lib/api'
import { removeInterview } from './create/action'

import { InterviewActionsProvider } from '@/app/hooks/InterviewActionsContext'
import { CACHE_TAG } from '@/constants/cacheTags'

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InterviewActionsProvider
      value={{
        removeInterview,
        getInterview,
        updateInterviewCache: async (id: string) => {
          'use server'
          updateTag(CACHE_TAG.INTERVIEWS)
          updateTag(CACHE_TAG.INTERVIEW(id))
        },
      }}
    >
      {children}
    </InterviewActionsProvider>
  )
}
