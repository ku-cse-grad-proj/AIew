import { Query } from '../_types'

type ResolvedSearchParams = {
  [key: string]: string | string[] | undefined
}

//URLSearchParmas의 생성자 type에 parmas 맞게 변환
export function getQuery(params: ResolvedSearchParams): Query {
  return Object.entries(params).filter((_, value) => value != null) as Query
}

export function getQueryWithoutPage(params: ResolvedSearchParams): Query {
  return getQuery(params).filter(([key]) => key !== 'page')
}
