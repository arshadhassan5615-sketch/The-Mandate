// Freeze fallback tests — Round 6 STEPs 3–4 (permanent, default suite).
//
// Drives the four traced freeze scenes through the real path:
// loadScene -> processChoice navigation -> the EXACT visible-list expression
// NarrativeScene renders (getAvailableChoices + ensureTerminalChoice) ->
// processChoice(Continue) -> advanceQueue. RNG is seeded so probability-gated
// chain ticks reproduce run to run.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import {
  getScene,
  getAvailableChoices,
  ensureTerminalChoice,
  ENGINE_CONTINUE_ID,
} from '../engine/NarrativeEngine'
import { evaluateAll } from '../engine/conditionEvaluator'
import { filterNarrative } from '../stores/narrativeStore'
import {
  resetWorld,
  bootWeek,
  pool,
  finishWeek,
  setWaiter,
} from './simHarness'
import type { AgendaItem } from '../types/week'

const game = () => useGameStore.getState()
const nar = () => useNarrativeStore.getState()
const wk = () => useWeekStore.getState()

function singleItem(sceneId: string): AgendaItem {
  return {
    id: `freeze-${sceneId}`,
    title: 'freeze proof',
    description: '',
    category: 'crisis',
    sceneId,
    slotCost: 0,
    executionOrder: 0,
    weekAvailable: 1,
  } as AgendaItem
}

/** The exact visible-list expression NarrativeScene renders. */
function visibleChoices(): { id: string; text?: string }[] {
  const scene = nar().currentScene
  if (!scene) return []
  return ensureTerminalChoice(getAvailableChoices(scene, game(), nar().activeFlags))
}

function expectContinueAlone(label: string): void {
  expect(visibleChoices().map(c => c.id), `${label} offers only Continue`).toEqual([ENGINE_CONTINUE_ID])
}

function completeContinue(sceneId: string): void {
  nar().processChoice(ENGINE_CONTINUE_ID)
  expect(nar().visitedSceneIds, `${sceneId} recorded`).toContain(sceneId)
  expect(nar().sceneDone, `${sceneId} done`).toBe(true)
}

describe('freeze fallback (Round 6 STEPs 3-4)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(ms => vi.advanceTimersByTimeAsync(ms))
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('the_kitchen: all 5 terminal segments offer Continue and complete', () => {
    const paths: [string, string[]][] = [
      ['w52_reflect_clean_break', ['endgame_both_broken']],
      ['w52_reflect_vael', ['endgame_vael_broken']],
      ['w52_reflect_morvec', ['endgame_morvec_broken']],
      ['w52_reflect_owned', ['endgame_owned_quietly']],
      ['w52_reflect_general', []],
    ]
    for (const [rootChoice, flags] of paths) {
      resetWorld()
      bootWeek(52, { flags })
      wk().launchSingleScene(singleItem('act3_week52_the_kitchen'))
      nar().processChoice(rootChoice)
      expectContinueAlone(`kitchen/${rootChoice}`)
      completeContinue('act3_week52_the_kitchen')
    }
  }, 30000)

  it('two-letters: all 4 terminal segments offer Continue and complete', () => {
    const paths: [string, string[]][] = [
      ['w47_break_vael', []],
      ['w47_break_morvec', []],
      ['w47_break_both', ['ledger_prosecute']],
      ['w47_pay_both', []],
    ]
    for (const [rootChoice, flags] of paths) {
      resetWorld()
      bootWeek(38, { flags })
      wk().launchSingleScene(singleItem('act3_week38_two_letters'))
      nar().processChoice(rootChoice)
      expectContinueAlone(`two-letters/${rootChoice}`)
      completeContinue('act3_week38_two_letters')
    }
  }, 30000)

  it('oil_outcome with no oil flags: data fallback appears and advances the queue', async () => {
    resetWorld()
    bootWeek(22)
    wk().launchSingleScene(singleItem('act2_week22_oil_outcome'))
    nar().processChoice('week22_read_telegram')
    // Round B1 STEP 2 added an authored fallback: the data choice wins over
    // the engine Continue (which remains the backstop if data ever regresses).
    expect(visibleChoices().map(c => c.id), 'oil hole shows data fallback').toEqual(['week22_no_deal_path'])
    nar().processChoice('week22_no_deal_path')
    expect(nar().visitedSceneIds, 'oil outcome recorded').toContain('act2_week22_oil_outcome')
    expect(nar().sceneDone, 'oil outcome done').toBe(true)
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(wk().phase, 'queue advanced back to map').toBe('map')
  }, 30000)

  it('week-52 ending on a middle run: Continue appears and advances the queue', async () => {
    resetWorld()
    bootWeek(52)
    // Middle run: no war/coup/IMA/khaled/family flags, middling stats —
    // none of the 10 conditional endings qualify.
    useGameStore.setState(s => ({
      factions: { ...s.factions, reformists: 20, ironCovenant: 10, workersCoalition: 20, halvekists: 50 },
      nation: { ...s.nation, economyHealth: 0, publicOrder: 50, militaryReadiness: 20 },
      personal: { ...s.personal, moralCompass: 50, tomasWellbeing: 50 },
    }))
    wk().launchSingleScene(singleItem('act4_week52_ending'))
    expectContinueAlone('week52_ending/middle-run')
    completeContinue('act4_week52_ending')
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(wk().phase, 'queue advanced back to map').toBe('map')
    expect(nar().activeFlags, 'no ending flags fabricated').not.toContain('ending_democratic_triumph')
  }, 30000)

  it('election_eve with a maximal flag set opens with at most 5 echoes', () => {
    resetWorld()
    const scene = getScene('act7_week103_election_eve')
    expect(scene, 'election_eve loads').toBeTruthy()
    // Maximal: every flag the scene reads, plus maxed stats.
    const flagSet = new Set<string>()
    const gather = (conds: unknown) => {
      for (const c of (conds as Record<string, unknown>[]) ?? []) {
        if (typeof c !== 'object' || !c) continue
        const rec = c as Record<string, unknown>
        if (typeof rec['flag'] === 'string') flagSet.add(rec['flag'] as string)
        if (typeof rec['stat'] === 'string' && (rec['stat'] as string).startsWith('flags.')) {
          flagSet.add((rec['stat'] as string).slice(6))
        }
      }
    }
    gather(scene!.prerequisites)
    for (const n of scene!.narrative ?? []) gather((n as { conditions?: unknown }).conditions)
    bootWeek(103, { flags: [...flagSet] })
    useGameStore.setState(s => ({
      factions: Object.fromEntries(Object.keys(s.factions).map(k => [k, 100])),
      nation: Object.fromEntries(Object.keys(s.nation).map(k => [k, 100])),
      personal: Object.fromEntries(Object.keys(s.personal).map(k => [k, 100])),
    }) as never)
    const kept = filterNarrative(scene!.narrative, game(), nar().activeFlags) ?? []
    const grouped = kept.filter(n => (n as { echoGroup?: string }).echoGroup)
    expect(grouped.length, 'at most 5 echo nodes under maximal flags').toBeLessThanOrEqual(5)
    expect(grouped.length, 'groups still represented').toBeGreaterThan(0)
  }, 30000)

  it('seeded RNG reproduces probability-gated ticks', async () => {
    resetWorld()
    bootWeek(32)
    useGameStore.setState(s => ({
      factions: { ...s.factions, halvekists: 80, ironCovenant: 80, dravenni: 5 },
      nation: { ...s.nation, publicOrder: 5 },
    }))
    await finishWeek()
    // Bombing is unconditional once triggered; the seed documents the run.
    expect(wk().forcedChainIds).toContain('act3_assassination_bombing')
  }, 30000)

  it('recurring dinner completes through its hub (display segs never navigated)', async () => {
    resetWorld()
    bootWeek(20)
    wk().launchSingleScene(singleItem('family_dinner_recurring'))
    nar().processChoice('dinner_continue')
    // Hub offers real choices — no fallback involved on the real path.
    expect(visibleChoices().map(c => c.id)).toContain('dinner_engage')
    expect(visibleChoices().map(c => c.id)).not.toContain(ENGINE_CONTINUE_ID)
    nar().processChoice('dinner_engage')
    expect(nar().visitedSceneIds).toContain('family_dinner_recurring')
    expect(nar().sceneDone).toBe(true)
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(wk().phase, 'queue advanced back to map').toBe('map')
  }, 30000)

  it('recurring briefing completes through its hub', async () => {
    resetWorld()
    bootWeek(20)
    wk().launchSingleScene(singleItem('intelligence_briefing_recurring'))
    nar().processChoice('briefing_continue')
    expect(visibleChoices().map(c => c.id)).toContain('briefing_fuller_report')
    expect(visibleChoices().map(c => c.id)).not.toContain(ENGINE_CONTINUE_ID)
    nar().processChoice('briefing_fuller_report')
    expect(nar().visitedSceneIds).toContain('intelligence_briefing_recurring')
    expect(nar().sceneDone).toBe(true)
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(wk().phase, 'queue advanced back to map').toBe('map')
  }, 30000)

  it('social roots complete via the interaction flow and still offer Continue', async () => {
    for (const sid of [
      'social_autumn_festival_wk18',
      'social_state_dinner_wk24',
      'social_independence_parade_wk36',
    ]) {
      resetWorld()
      bootWeek(24)
      wk().launchSingleScene(singleItem(sid))
      // Real path: SocialEvent runs socialInteractions, never currentScene.choices.
      const scene = getScene(sid)
      expect((scene!.socialInteractions ?? []).length, `${sid} has interactions`).toBeGreaterThan(0)
      // Defense in depth: if ever rendered in NarrativeScene, the fallback fires.
      expect(visibleChoices().map(c => c.id), `${sid} offers Continue`).toEqual([ENGINE_CONTINUE_ID])
      nar().processChoice(ENGINE_CONTINUE_ID)
      expect(nar().visitedSceneIds, `${sid} recorded`).toContain(sid)
      expect(nar().sceneDone, `${sid} done`).toBe(true)
      wk().advanceQueue()
      await vi.advanceTimersByTimeAsync(700)
      expect(wk().phase, `${sid} queue advanced`).toBe('map')
    }
  }, 30000)

  it('router fallbacks appear exactly when no branch matches', () => {
    // Oil telegram: hole state (no oil flags) shows only the fallback.
    resetWorld()
    bootWeek(22)
    nar().loadScene('act2_week22_oil_outcome')
    nar().processChoice('week22_read_telegram')
    expect(visibleChoices().map(c => c.id), 'oil hole shows fallback').toEqual(['week22_no_deal_path'])

    // Oil telegram: signed deal shows only the success path.
    resetWorld()
    bootWeek(22, { flags: ['oil_deal_hybrid_signed'] })
    nar().loadScene('act2_week22_oil_outcome')
    nar().processChoice('week22_read_telegram')
    expect(visibleChoices().map(c => c.id), 'oil signed hides fallback').toEqual(['week22_deal_success_path'])

    // Sovarka outcome: hole state shows only the fallback.
    resetWorld()
    bootWeek(37)
    nar().loadScene('act3_week37_sovarka_outcome')
    nar().processChoice('sovarka_outcome_hear')
    expect(visibleChoices().map(c => c.id), 'sovarka hole shows fallback').toEqual(['sovarka_outcome_no_data'])

    // Sovarka outcome: signed deal shows only the full-deal branch.
    resetWorld()
    bootWeek(37, { flags: ['sovarka_deal_signed'] })
    nar().loadScene('act3_week37_sovarka_outcome')
    nar().processChoice('sovarka_outcome_hear')
    expect(visibleChoices().map(c => c.id), 'sovarka signed hides fallback').toEqual(['sovarka_outcome_full_deal'])
  }, 30000)
})
