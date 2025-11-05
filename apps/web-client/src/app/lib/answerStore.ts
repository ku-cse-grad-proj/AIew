import { create } from 'zustand'

type AnswerState = {
  stepId: string | null
  isRedo: boolean
  startAt: number | null
  endAt: number | null
  setIsRedo: (redo: boolean) => void
  startAnswer: (stepId: string, now: number) => void
  setEndAt: (now: number | null) => void
  reset: () => void
}

export const useAnswerStore = create<AnswerState>((set, get, store) => ({
  stepId: null,
  isRedo: false,
  startAt: null,
  endAt: null,

  setIsRedo: (redo: boolean) => set({ isRedo: redo }),
  startAnswer: (stepId: string, now: number) =>
    set({ stepId: stepId, startAt: now }),
  setEndAt: (now) => set({ endAt: now }),
  reset: () => set(store.getInitialState()),
}))
