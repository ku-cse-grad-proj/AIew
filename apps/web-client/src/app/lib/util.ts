export function extractDate(isoString: string): string {
  return isoString.split('T')[0]
}

export function formatDateTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
