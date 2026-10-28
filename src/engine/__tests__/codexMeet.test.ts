import { describe, it, expect } from 'vitest'
import { codexIdsUnlockedByMeeting, MET_UNLOCK } from '../codexMeet'

const entries = [
  { id: 'character_gregor_maric', unlockCondition: MET_UNLOCK },
  { id: 'character_danika_oberlin', unlockCondition: MET_UNLOCK },
  { id: 'character_jonas', unlockCondition: 'start' },
  { id: 'character_flagged', unlockCondition: 'some_flag' },
]

describe('codexIdsUnlockedByMeeting', () => {
  it('returns only met-gated entries among newly met ids', () => {
    expect(
      codexIdsUnlockedByMeeting(['character_gregor_maric', 'character_unknown'], entries),
    ).toEqual(['character_gregor_maric'])
  })

  it('ignores start and flag-gated entries even if met', () => {
    expect(
      codexIdsUnlockedByMeeting(['character_jonas', 'character_flagged'], entries),
    ).toEqual([])
  })

  it('keeps meeting order', () => {
    expect(
      codexIdsUnlockedByMeeting(['character_danika_oberlin', 'character_gregor_maric'], entries),
    ).toEqual(['character_danika_oberlin', 'character_gregor_maric'])
  })

  it('de-duplicates', () => {
    expect(
      codexIdsUnlockedByMeeting(
        ['character_gregor_maric', 'character_gregor_maric'],
        entries,
      ),
    ).toEqual(['character_gregor_maric'])
  })

  it('returns [] for no newly met characters', () => {
    expect(codexIdsUnlockedByMeeting([], entries)).toEqual([])
  })
})
