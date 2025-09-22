import { create } from 'zustand'

type AnswerState = {
  isRedo: boolean
  startAt: number | null
  endAt: number | null
  setIsRedo: (redo: boolean) => void
  setStartAt: (now: number | null) => void
  setEndAt: (now: number | null) => void
  reset: () => void
}

export const useAnswerStore = create<AnswerState>((set, get, store) => ({
  isRedo: false,
  startAt: null,
  endAt: null,

  setIsRedo: (redo: boolean) => set({ isRedo: redo }),
  setStartAt: (now) => set({ startAt: now }),
  setEndAt: (now) => set({ endAt: now }),
  reset: () => set(store.getInitialState()),
}))
