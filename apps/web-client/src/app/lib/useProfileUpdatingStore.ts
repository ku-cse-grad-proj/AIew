import { create } from 'zustand'

type ProfileUpdatingState = {
  isUpdating: boolean
  setIsUpdating: (value: boolean) => void
}

export const useProfileUpdatingStore = create<ProfileUpdatingState>((set) => ({
  isUpdating: false,
  setIsUpdating: (value: boolean) => set({ isUpdating: value }),
}))
