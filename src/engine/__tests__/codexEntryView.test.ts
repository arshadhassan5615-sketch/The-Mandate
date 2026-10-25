import { describe, it, expect } from 'vitest'
import characters from '../../data/codex/characters.json'
import { MINISTER_CANDIDATES } from '../../data/ministers'
import { appointmentStatus, viewCodexEntry } from '../codexEntryView'
import type { CabinetSnapshot } from '../codexEntryView'
import type { CodexEntry } from '../../types/codex'

const entries = characters as CodexEntry[]
const oberlin = entries.find(e => e.id === 'character_danika_oberlin')
if (!oberlin) throw new Error('character_danika_oberlin missing from characters.json')

const EMPTY_CABINET: CabinetSnapshot = { ministers: {}, dismissedMinisters: [] }
const SERVING_OBERLIN: CabinetSnapshot = {
  ministers: { interior: { id: 'danika_oberlin' } },
  dismissedMinisters: [],
}
const FORMER_OBERLIN: CabinetSnapshot = {
  ministers: { interior: null },
  dismissedMinisters: [{ id: 'danika_oberlin' }],
}

const PLAIN_ENTRY: CodexEntry = {
  id: 'history_example',
  category: 'history',
  title: 'Example Entry',
  content: '**A lead line.**\n\nBody text.',
  unlockCondition: 'start',
}

describe('appointmentStatus', () => {
  it('reports a candidate who was never appointed', () => {
    expect(appointmentStatus('danika_oberlin', EMPTY_CABINET)).toBe('candidate')
  })

  it('reports a candidate who is currently serving', () => {
    expect(appointmentStatus('danika_oberlin', SERVING_OBERLIN)).toBe('serving')
  })

  it('reports a dismissed candidate as former', () => {
    expect(appointmentStatus('danika_oberlin', FORMER_OBERLIN)).toBe('former')
  })

  it('ignores ministers serving in other ministries', () => {
    const cabinet: CabinetSnapshot = { ministers: { labor: { id: 'gregor_maric' } }, dismissedMinisters: [] }
    expect(appointmentStatus('danika_oberlin', cabinet)).toBe('candidate')
  })
})

describe('viewCodexEntry for Danika Oberlin', () => {
  it('labels her as a candidate before appointment', () => {
    const view = viewCodexEntry(oberlin!, EMPTY_CABINET)
    expect(view.title).toBe('Danika Oberlin — Candidate for Interior Minister')
    expect(view.content).toContain('**Candidate for Interior Minister. BNI abolitionist. Age 39.**')
    expect(view.content).not.toContain('**Interior Minister.')
  })

  it('keeps the original title and lead line while she is serving', () => {
    const view = viewCodexEntry(oberlin!, SERVING_OBERLIN)
    expect(view.title).toBe('Danika Oberlin — Interior Minister')
    expect(view.content).toBe(oberlin!.content)
  })

  it('labels her as former after dismissal', () => {
    const view = viewCodexEntry(oberlin!, FORMER_OBERLIN)
    expect(view.title).toBe('Danika Oberlin — Former Interior Minister')
    expect(view.content).toContain('**Former Interior Minister. BNI abolitionist. Age 39.**')
  })
})

describe('viewCodexEntry for entries without an appointment', () => {
  it('returns title and content unchanged', () => {
    const view = viewCodexEntry(PLAIN_ENTRY, EMPTY_CABINET)
    expect(view).toEqual({ title: PLAIN_ENTRY.title, content: PLAIN_ENTRY.content })
  })
})

describe('codex appointment data guard', () => {
  const withAppointment = entries.filter(e => e.appointment !== undefined)

  it('has appointment entries to check', () => {
    expect(withAppointment.length).toBeGreaterThan(0)
  })

  it.each(withAppointment.map(e => [e.id, e] as const))('%s has consistent title, lead line and candidate id', (_id, entry) => {
    const { candidateId, role } = entry.appointment!
    expect(entry.title).toContain(`— ${role}`)
    expect(entry.content).toContain(`**${role}.`)
    expect(MINISTER_CANDIDATES.some(c => c.id === candidateId)).toBe(true)
  })
})
