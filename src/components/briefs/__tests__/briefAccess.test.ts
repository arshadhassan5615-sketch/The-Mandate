import { describe, it, expect } from 'vitest'
import { isBriefUnlocked, unreadBriefCount } from '../briefAccess'

const start = { id: 'veltria', unlockCondition: 'start' }
const flagged = { id: 'mole_file', unlockCondition: 'mole_revealed' }
const granted = { id: 'secret_treaty', unlockCondition: 'treaty_flag' }

describe('isBriefUnlocked', () => {
  it('opens start briefs, flag briefs once the flag is set, and granted briefs', () => {
    expect(isBriefUnlocked(start, [], [])).toBe(true)
    expect(isBriefUnlocked(flagged, [], [])).toBe(false)
    expect(isBriefUnlocked(flagged, ['mole_revealed'], [])).toBe(true)
    expect(isBriefUnlocked(granted, [], ['secret_treaty'])).toBe(true)
  })
})

describe('unreadBriefCount', () => {
  it('counts unlocked briefs not yet opened, ignoring start briefs and locked ones', () => {
    const all = [start, flagged, granted]
    expect(unreadBriefCount(all, ['mole_revealed'], [], [])).toBe(1)
    expect(unreadBriefCount(all, ['mole_revealed'], [], ['mole_file'])).toBe(0)
    expect(unreadBriefCount(all, [], [], [])).toBe(0)
  })
})
