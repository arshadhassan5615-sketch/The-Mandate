import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { buildWeekRecap } from '../recapItems'
import WeekRecap from '../WeekRecap'
import { useJournalStore } from '../../../stores/journalStore'
import type { JournalEntry } from '../../../types/journal'

let seq = 0
function entry(over: Partial<JournalEntry>): JournalEntry {
  seq += 1
  return {
    id: `e${seq}`, weekNumber: 4, date: '', category: 'policy', alignment: null,
    title: `Decision ${seq}`, description: `Described ${seq}`, consequences: null, icon: '',
    sceneId: 's', choiceId: `c${seq}`, flag: null, createdAt: seq, ...over,
  }
}

describe('buildWeekRecap', () => {
  it('only uses entries from the previous week', () => {
    const items = buildWeekRecap([entry({ weekNumber: 3 }), entry({ weekNumber: 4, title: 'Kept' }), entry({ weekNumber: 5 })], 5)
    expect(items.map(i => i.title)).toEqual(['Kept'])
  })

  it('keeps at most three, consequences first, then newest', () => {
    const items = buildWeekRecap([
      entry({ title: 'old plain' }),
      entry({ title: 'with consequence', consequences: 'The strike ended.' }),
      entry({ title: 'new plain' }),
      entry({ title: 'newest plain' }),
    ], 5)
    expect(items.map(i => i.title)).toEqual(['with consequence', 'newest plain', 'new plain'])
    expect(items[0].text).toBe('The strike ended.')
  })

  it('falls back to the description when there is no consequence', () => {
    expect(buildWeekRecap([entry({ description: 'You chose restraint.' })], 5)[0].text).toBe('You chose restraint.')
  })

  it('is empty in week 1', () => {
    expect(buildWeekRecap([entry({ weekNumber: 1 })], 1)).toEqual([])
  })
})

describe('WeekRecap', () => {
  beforeEach(() => useJournalStore.setState({ entries: [] }))

  it('renders nothing without last-week entries', () => {
    const { container } = render(<WeekRecap currentWeek={5} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('lists last week under a labelled heading', () => {
    useJournalStore.setState({ entries: [entry({ category: 'legislation', title: 'Signed the press bill' })] })
    render(<WeekRecap currentWeek={5} />)
    expect(screen.getByRole('heading', { name: /Last Week — Week 4/ })).toBeInTheDocument()
    expect(screen.getByText('Signed the press bill')).toBeInTheDocument()
    expect(screen.getByText('Legislation')).toBeInTheDocument()
  })
})
