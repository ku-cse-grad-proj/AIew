import { create } from 'zustand'

type ReportSearchState = {
  searchType: 'title' | 'company'
  searchValue: string | null
  fromDate: string
  toDate: string
  job: string | null
  detailJob: string | null
  setSearchType: (type: 'title' | 'company') => void
  setSearchValue: (value: string) => void
  setFromDate: (date: string) => void
  setToDate: (date: string) => void
  setJob: (job: string | null) => void
  setDetailJob: (detailJob: string | null) => void
  reset: () => void
}
export const useReportSearchStore = create<ReportSearchState>(
  (set, get, store) => ({
    searchType: 'title',
    searchValue: null,
    fromDate: '',
    toDate: '',
    job: null,
    detailJob: null,
    setSearchType: (type: 'title' | 'company') => set({ searchType: type }),
    setSearchValue: (value: string | null) => set({ searchValue: value }),
    setFromDate: (date: string) => set({ fromDate: date }),
    setToDate: (date: string) => set({ toDate: date }),
    setJob: (job: string | null) => set({ job }),
    setDetailJob: (detailJob: string | null) => set({ detailJob }),
    reset: () => set(store.getInitialState()),
  }),
)
