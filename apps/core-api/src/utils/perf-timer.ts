export function createPerfTimer() {
  const start = performance.now()
  const laps: Record<string, number> = {}
  let lapStart = start

  return {
    lap(name: string) {
      const now = performance.now()
      laps[name] = Math.round(now - lapStart)
      lapStart = now
    },
    summary() {
      return { ...laps, total: Math.round(performance.now() - start) }
    },
  }
}
