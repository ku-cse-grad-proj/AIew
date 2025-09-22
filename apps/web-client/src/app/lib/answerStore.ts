import { create } from 'zustand'

type AnswerState = {
  startAt: number | null
  endAt: number | null
  setStartAt: (now: number | null) => void
  setEndAt: (now: number | null) => void
  reset: () => void
}

export const useAnswerStore = create<AnswerState>((set, get, store) => ({
  startAt: null,
  endAt: null,

  setStartAt: (now) => set({ startAt: now }),
  setEndAt: (now) => set({ endAt: now }),
  reset: () => set(store.getInitialState()),
}))
