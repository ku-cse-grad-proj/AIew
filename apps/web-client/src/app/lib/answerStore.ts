import { create } from 'zustand'

type AnswerState = {
  startAt: number | null
  setStartAt: (now: number | null) => void
}

export const useAnswerStore = create<AnswerState>((set) => ({
  startAt: null,
  setStartAt: (now) => set({ startAt: now }),
}))
