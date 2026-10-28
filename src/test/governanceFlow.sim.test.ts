// End-to-end checks for provincial governance through the real week pipeline:
// a promise made in a people's audience breaks at its deadline when the week
// ends and unlocks the angry callback; keeping it unlocks the grateful one;
// appointing a governor changes who holds office; signing the Self-Government
// Act holds elections at the next week boundary.
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useCommitmentStore } from '../stores/commitmentStore'
import { governorInOffice } from '../engine/governors'
import { bootWeek, finishWeek, offeredIds, playItem, pool, resetWorld } from './simHarness'
import type { SceneChoice } from '../types/narrative'

const SIM_TIMEOUT_MS = 30_000

function chooseId(id: string) {
  return (choices: SceneChoice[]) => {
    const choice = choices.find(c => c.id === id)
    if (!choice) throw new Error(`choice ${id} not offered: ${choices.map(c => c.id).join(', ')}`)
    return choice
  }
}

async function playAgenda(itemId: string, choiceId: string): Promise<void> {
  const item = pool().find(i => i.id === itemId)
  if (!item) throw new Error(`${itemId} not in the pool: ${offeredIds().join(', ')}`)
  const launched = await playItem(item, { choose: chooseId(choiceId) })
  expect(launched).toBe(true)
}

/** Ends the given week through completeWeek with an empty pool, so no gate blocks it. */
async function endWeek(week: number): Promise<void> {
  useGameStore.getState().devSetWeek(week)
  await finishWeek()
}

const flags = () => useNarrativeStore.getState().activeFlags

describe('provincial governance through the week pipeline', () => {
  beforeEach(() => {
    resetWorld()
    useCommitmentStore.getState().reset()
  })

  it('a broken Kravenstal promise costs once at its deadline and unlocks the angry callback', async () => {
    bootWeek(9)
    await playAgenda('agenda_rep_kravenstal_audience', 'rep_kravenstal_promise')
    const promise = useCommitmentStore.getState().commitments.find(c => c.flags.includes('rep_kravenstal_promise'))
    expect(promise).toBeDefined()

    // Made in week 9 with a 10-week deadline: still on record when week 19 ends.
    await endWeek(18)
    expect(flags()).not.toContain('promise_broken_rep_kravenstal_promise')

    await endWeek(19)
    expect(flags()).toContain('promise_broken_rep_kravenstal_promise')
    const penalties = useGameStore.getState().effectLog.filter(e => e.sourceId === promise!.id)
    expect(penalties.map(e => e.stat).sort()).toEqual(['factions.workersCoalition', 'personal.publicImage'])

    await endWeek(21)
    expect(useGameStore.getState().effectLog.filter(e => e.sourceId === promise!.id)).toHaveLength(2)

    bootWeek(23)
    expect(offeredIds()).toContain('agenda_rep_kravenstal_callback_broken')
    expect(offeredIds()).not.toContain('agenda_rep_kravenstal_callback_kept')
  }, SIM_TIMEOUT_MS)

  it('a kept Kravenstal promise never breaks and unlocks the grateful callback', async () => {
    bootWeek(9)
    await playAgenda('agenda_rep_kravenstal_audience', 'rep_kravenstal_promise')
    bootWeek(10)
    await playAgenda('agenda_rep_kravenstal_clinic_order', 'clinic_order_fund')
    expect(flags()).toContain('rep_kravenstal_kept')

    await endWeek(22)
    expect(flags()).not.toContain('promise_broken_rep_kravenstal_promise')

    bootWeek(23)
    expect(offeredIds()).toContain('agenda_rep_kravenstal_callback_kept')
    expect(offeredIds()).not.toContain('agenda_rep_kravenstal_callback_broken')
    expect(offeredIds()).not.toContain('agenda_rep_kravenstal_clinic_order')
  }, SIM_TIMEOUT_MS)

  it('appointing a Kravenstal governor puts her in office', async () => {
    expect(governorInOffice('kravenstal', flags()).governor.id).toBe('kral')
    expect(useNarrativeStore.getState().unlockedCodexIds).not.toContain('character_hana_novak')
    bootWeek(4)
    await playAgenda('agenda_gov_kravenstal_appointment', 'gov_kravenstal_appoint_novak')
    expect(governorInOffice('kravenstal', flags())).toMatchObject({ source: 'appointed', governor: { id: 'novak' } })
    // Meeting her in the scene opens her codex brief ("met" unlock).
    expect(useNarrativeStore.getState().unlockedCodexIds).toContain('character_hana_novak')
  }, SIM_TIMEOUT_MS)

  it('signing the Self-Government Act holds elections at the next week boundary and offers the results', async () => {
    useNarrativeStore.getState().addFlags(['self_government_act_signed'])
    await endWeek(25)
    expect(flags()).toContain('provincial_elections_held')
    expect(flags().filter(f => /^governor_[a-z]+_elected_[a-z]+$/.test(f))).toHaveLength(6)

    bootWeek(26)
    expect(offeredIds()).toContain('agenda_gov_provincial_elections_results')
  }, SIM_TIMEOUT_MS)
})
