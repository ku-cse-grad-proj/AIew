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

export function getPage(params: ResolvedSearchParams): number {
  const page = params['page']
  if (Array.isArray(page)) {
    return parseInt(page[0]) || 1
  }
  return parseInt(page || '1') || 1
}

export function setPageInQuery(query: Query, page: number): Query {
  const filteredQuery = query.filter(([key]) => key !== 'page')
  return [...filteredQuery, ['page', page.toString()]]
}
