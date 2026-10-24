// Calendar helpers for the 1963 timeline. Engine-level so that engine code never
// has to import from the UI layer.

/** Formats a calendar date the way the game prints dates: "1 October 1963". */
export function formatGameDate(d: Date): string {
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`
}

export function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return formatGameDate(d)
}
