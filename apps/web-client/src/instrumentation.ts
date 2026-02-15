import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 23)
  const message = error instanceof Error ? error.message : String(error)
  const digest =
    error instanceof Error && 'digest' in error
      ? (error as { digest: string }).digest
      : undefined
  console.error(
    `${time} [${context.routeType}] ${request.method} ${request.path}`,
    {
      routerKind: context.routerKind,
      routePath: context.routePath,
      message,
      digest,
    },
  )
}
