import { describe, it, expect } from 'vitest'
import { buildLawRecords, buildDecreeRecords, LAW_OUTCOME } from '../stateRecords'
import type { Bill, BillHistoryEntry } from '../../../types/bills'
import type { Decree } from '../../../types/decree'

const bill = (id: string, title: string): Bill => ({
  id, title, shortName: title, proposer: 'p', faction: 'f', weekPresented: 1, fullText: '',
  budgetCost: 0, signEffects: [], vetoEffects: [], signFlags: [], vetoFlags: [], isVetoable: true,
})

const entry = (billId: string, decision: BillHistoryEntry['decision'], weekDecided: number, billTitle?: string): BillHistoryEntry =>
  ({ billId, decision, weekDecided, weekPresented: weekDecided, billTitle })

const decree = (id: string, title: string): Decree => ({
  id, title, category: 'economic', proposedBy: 'Ministry of Finance', summary: `${title} summary`,
  description: 'long text', weekProposed: 3, ministerPositions: [],
  immediateEffects: [{ stat: 'secretStat', value: 5, description: 'hidden consequence' }],
  longTermEffects: [], signed: true,
})

describe('buildLawRecords', () => {
  it('lists newest decisions first', () => {
    const records = buildLawRecords([entry('a', 'signed', 2, 'A'), entry('b', 'vetoed', 9, 'B')], [])
    expect(records.map(r => r.title)).toEqual(['B', 'A'])
  })

  it('falls back to the catalogue title when the entry has none', () => {
    const records = buildLawRecords([entry('tax', 'signed', 4)], [bill('tax', 'Tax Reform Act')])
    expect(records[0].title).toBe('Tax Reform Act')
  })

  it('labels every outcome and marks which ones became law', () => {
    const records = buildLawRecords([
      entry('a', 'signed', 1, 'A'), entry('b', 'auto_passed', 2, 'B'),
      entry('c', 'overridden', 3, 'C'), entry('d', 'vetoed', 4, 'D'),
    ], [])
    const byTitle = Object.fromEntries(records.map(r => [r.title, r]))
    expect(byTitle.A.outcome).toBe(LAW_OUTCOME.signed.label)
    expect(byTitle.D.isLaw).toBe(false)
    expect(['A', 'B', 'C'].every(t => byTitle[t].isLaw)).toBe(true)
  })

  it('does not mutate the input history', () => {
    const history = [entry('a', 'signed', 2, 'A'), entry('b', 'signed', 9, 'B')]
    buildLawRecords(history, [])
    expect(history[0].billId).toBe('a')
  })
})

describe('buildDecreeRecords', () => {
  it('lists the most recently signed decree first', () => {
    const records = buildDecreeRecords([decree('one', 'First'), decree('two', 'Second')])
    expect(records.map(r => r.title)).toEqual(['Second', 'First'])
  })

  it('carries only player-visible fields, never effects', () => {
    const [record] = buildDecreeRecords([decree('one', 'First')])
    expect(record).toEqual({
      id: 'one', title: 'First', category: 'Economic', proposedBy: 'Ministry of Finance', summary: 'First summary',
    })
  })
})
