// Spine integrity test — Round 4 STEP 2 (permanent, default suite).
//
// Scripted backbone paths. Each asserts the right scene fires exactly once in
// its window and the sibling does not. Runs with the fake-timer waiter so the
// whole file stays far under 60s. No env gate.
//
// Conventions: resetWorld per test; drive REAL store actions (launch /
// processChoice / confirmAgenda / resolveVote / completeWeek); seed ONLY the
// documented precondition flags or stats for the path under test.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useChainStore } from '../stores/chainStore'
import type { NarrativeNode } from '../types/narrative'
import { getScene, getAvailableChoices } from '../engine/NarrativeEngine'
import { evaluateAll } from '../engine/conditionEvaluator'
import { filterNarrative } from '../stores/narrativeStore'
import { resolveVote } from '../engine/VoteEngine'
import {
  resetWorld,
  bootWeek,
  pool,
  playItem,
  finishWeek,
  setWaiter,
} from './simHarness'
import type { AgendaItem } from '../types/week'

const game = () => useGameStore.getState()
const nar = () => useNarrativeStore.getState()
const wk = () => useWeekStore.getState()
const chn = () => useChainStore.getState()
const visited = () => nar().visitedSceneIds
const countVisits = (id: string) => visited().filter(v => v === id).length

function setFactions(patch: Record<string, number>): void {
  useGameStore.setState({ factions: { ...game().factions, ...patch } } as never)
}

function allFactions(v: number): void {
  setFactions({
    reformists: v,
    halvekists: v,
    workersCoalition: v,
    ironCovenant: v,
    church: v,
    dravenni: v,
    businessClass: v,
  })
}

/** Choices currently playable, following root -> active segment like the UI. */
function availChoices(): { id: string }[] {
  const scene = nar().currentScene
  if (!scene) return []
  const segId = nar().activeSegmentId
  if (segId && scene.segments?.[segId]) {
    const seg = scene.segments[segId]
    return (seg.choices ?? []).filter(c => !c.conditions || evaluateAll(c.conditions, game(), nar().activeFlags))
  }
  return getAvailableChoices(scene, game(), nar().activeFlags)
}

/**
 * Resolve a __vote__ pool item the way LobbyingInterface.handleCommit does
 * with zero spend (deterministic: applySpending(., 0) is randomness-free):
 * real projection math, real success/failure flags, then advance the queue.
 */
async function resolveVoteItem(item: AgendaItem, expectPass: boolean): Promise<boolean> {
  wk().launchSingleScene(item)
  const cfg = item.voteConfig
  expect(cfg, `${item.id} carries a voteConfig`).toBeTruthy()
  if (!cfg) return false
  const result = resolveVote(game().factions, 0, cfg.threshold ?? 126)
  expect(result.passed, `${item.id} resolves ${expectPass ? 'PASS' : 'FAIL'}`).toBe(expectPass)
  nar().addFlags(result.passed ? cfg.successFlags : cfg.failureFlags)
  game().applyModifiers([
    { stat: 'nation.assemblyVoteMargin', operation: 'set', value: Math.abs(result.margin) },
  ])
  wk().advanceQueue()
  await vi.advanceTimersByTimeAsync(700)
  return result.willPass
}

/** Play a narrative pool item through one real choice (effects + scheduling). */
async function playChoice(item: AgendaItem, choiceId?: string): Promise<string> {
  wk().launchSingleScene(item)
  expect(nar().currentScene?.id, `${item.id} loads ${item.sceneId}`).toBe(item.sceneId)
  const avail = availChoices().map(c => c.id)
  const pick = choiceId ?? avail[0]
  expect(avail, `${item.sceneId} offers ${pick ?? '(any choice)'}`).toContain(pick)
  nar().processChoice(pick)
  wk().advanceQueue()
  await vi.advanceTimersByTimeAsync(700)
  return pick
}

/**
 * Drain the confirmAgenda queue in order (chain companions first), the way the
 * map does: items whose prerequisites fail are SKIPPED by advanceQueue, never
 * launched — this skip is the fallen-xor-survived mechanism under test.
 * Operates on the live queue (no re-launch: launchSingleScene would replace it).
 */
async function confirmAndDrain(vote: Record<string, boolean> = {}, choices: Record<string, string> = {}): Promise<void> {
  wk().confirmAgenda()
  for (let guard = 0; guard < 12; guard++) {
    const q = wk().sceneQueue
    const idx = wk().currentQueueIndex
    if (wk().phase === 'map' || wk().phase === 'review' || idx >= q.length) return
    const item = q[idx]
    const unmet = !!item.prerequisites?.length && !evaluateAll(item.prerequisites, game(), nar().activeFlags)
    if (unmet) {
      wk().advanceQueue()
      await vi.advanceTimersByTimeAsync(700)
      continue
    }
    if (item.sceneId === '__vote__') {
      const cfg = item.voteConfig
      expect(cfg, `${item.id} carries a voteConfig`).toBeTruthy()
      const dir = vote[item.id] ?? vote[item.sceneId] ?? true
      const result = resolveVote(game().factions, 0, cfg!.threshold ?? 126)
      expect(result.passed, `${item.id} resolves ${dir ? 'PASS' : 'FAIL'}`).toBe(dir)
      nar().addFlags(result.passed ? cfg!.successFlags : cfg!.failureFlags)
      game().applyModifiers([
        { stat: 'nation.assemblyVoteMargin', operation: 'set', value: Math.abs(result.margin) },
      ])
      wk().advanceQueue()
      await vi.advanceTimersByTimeAsync(700)
    } else if (item.sceneId.startsWith('__')) {
      // Virtual item already loaded by the queue — complete in place
      // (playItem would re-launch and replace the live queue).
      nar().markSceneVisited(item.sceneId)
      wk().advanceQueue()
      await vi.advanceTimersByTimeAsync(700)
    } else {
      expect(nar().currentScene?.id, `queue loads ${item.sceneId}`).toBe(item.sceneId)
      const avail = availChoices().map(c => c.id)
      const pick = choices[item.sceneId] ?? avail[0]
      expect(avail, `${item.sceneId} offers ${pick ?? '(any choice)'}`).toContain(pick)
      nar().processChoice(pick)
      wk().advanceQueue()
      await vi.advanceTimersByTimeAsync(700)
    }
  }
  throw new Error('confirmAndDrain: queue did not settle')
}

describe('spine integrity (Round 4 STEP 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(ms => vi.advanceTimersByTimeAsync(ms))
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  it('referendum passes decisive: aftermath + pass press variant, exactly once', async () => {
    allFactions(100)
    // Decisive needs reformists>=62 AND halvekists<=40; halvekists at 30 still
    // leaves 180 yes-votes (threshold 126), so the division passes.
    setFactions({ halvekists: 30 })
    bootWeek(26)
    const vote = pool().find(i => i.id === 'agenda_w26_referendum_vote_result')
    expect(vote, 'week-26 vote offered').toBeTruthy()
    await resolveVoteItem(vote!, true)
    expect(nar().activeFlags, 'referendum_passed set by the vote').toContain('referendum_passed')

    const ids = pool().map(i => i.sceneId)
    expect(ids, 'decisive offered').toContain('act2_week26_referendum_decisive')
    expect(ids, 'narrow not offered at 100 reformists').not.toContain('act2_week26_referendum_narrow')
    expect(ids, 'rejected not offered on pass').not.toContain('act2_week26_referendum_rejected')
    await playChoice(pool().find(i => i.sceneId === 'act2_week26_referendum_decisive')!, 'referendum_decisive_reach_out')
    expect(countVisits('act2_week26_referendum_decisive')).toBe(1)

    await finishWeek()
    useWeekStore.getState().initWeek()
    const w27 = pool().map(i => i.sceneId)
    expect(w27, 'pass press conference offered week 27').toContain('act2_week27_press_conference')
    expect(w27, 'failed variant absent on pass').not.toContain('act2_week27_press_conference_failed')
    await playChoice(pool().find(i => i.sceneId === 'act2_week27_press_conference')!)
    expect(countVisits('act2_week27_press_conference')).toBe(1)
    expect(visited()).not.toContain('act2_week26_referendum_narrow')
    expect(visited()).not.toContain('act2_week26_referendum_rejected')
    expect(visited()).not.toContain('act2_week27_press_conference_failed')
  }, 30000)

  it('referendum passes narrow: narrow aftermath, no decisive', async () => {
    setFactions({ reformists: 55, halvekists: 50, workersCoalition: 100, ironCovenant: 100, church: 100, dravenni: 100, businessClass: 100 })
    bootWeek(26)
    const vote = pool().find(i => i.id === 'agenda_w26_referendum_vote_result')
    await resolveVoteItem(vote!, true)
    const ids = pool().map(i => i.sceneId)
    expect(ids, 'narrow offered at 55/50').toContain('act2_week26_referendum_narrow')
    expect(ids, 'decisive absent below 62').not.toContain('act2_week26_referendum_decisive')
    await playChoice(pool().find(i => i.sceneId === 'act2_week26_referendum_narrow')!, 'referendum_narrow_defend_result')
    expect(countVisits('act2_week26_referendum_narrow')).toBe(1)
    await finishWeek()
    useWeekStore.getState().initWeek()
    expect(pool().map(i => i.sceneId), 'press conference follows narrow').toContain('act2_week27_press_conference')
    expect(visited()).not.toContain('act2_week26_referendum_decisive')
  }, 30000)

  it('referendum fails: rejected aftermath + failed press variant', async () => {
    allFactions(0)
    bootWeek(26)
    const vote = pool().find(i => i.id === 'agenda_w26_referendum_vote_result')
    await resolveVoteItem(vote!, false)
    expect(nar().activeFlags).toContain('referendum_failed')
    const ids = pool().map(i => i.sceneId)
    expect(ids, 'rejected offered on fail').toContain('act2_week26_referendum_rejected')
    expect(ids).not.toContain('act2_week26_referendum_decisive')
    expect(ids).not.toContain('act2_week26_referendum_narrow')
    await playChoice(pool().find(i => i.sceneId === 'act2_week26_referendum_rejected')!)
    expect(countVisits('act2_week26_referendum_rejected')).toBe(1)
    await finishWeek()
    useWeekStore.getState().initWeek()
    const w27 = pool().map(i => i.sceneId)
    expect(w27, 'failed variant offered').toContain('act2_week27_press_conference_failed')
    expect(w27, 'pass variant absent on fail').not.toContain('act2_week27_press_conference')
    await playChoice(pool().find(i => i.sceneId === 'act2_week27_press_conference_failed')!)
    expect(countVisits('act2_week27_press_conference_failed')).toBe(1)
  }, 30000)

  it('no-confidence lost: fallen fires, survived does not', async () => {
    allFactions(100)
    bootWeek(30)
    chn().schedule([{ targetNodeId: 'act3_confidence_vote', delayWeeks: 0 }], 30, 'spine')
    await finishWeek()
    useWeekStore.getState().initWeek()
    expect(wk().forcedChainIds, 'confidence vote fired').toContain('act3_confidence_vote')
    // Lose the division (motion PASSES): full faction support.
    allFactions(100)
    await confirmAndDrain({ __no_confidence_vote__: true })
    expect(countVisits('act3_no_confidence_fallen')).toBe(1)
    expect(visited(), 'survived sibling absent').not.toContain('act3_no_confidence_survived')
    expect(nar().activeFlags).toContain('no_confidence_passed')
  }, 30000)

  it('no-confidence survived: survived fires, fallen does not', async () => {
    allFactions(100)
    bootWeek(30)
    chn().schedule([{ targetNodeId: 'act3_confidence_vote', delayWeeks: 0 }], 30, 'spine')
    await finishWeek()
    useWeekStore.getState().initWeek()
    // Survive the division (motion FAILS): no faction support.
    allFactions(0)
    await confirmAndDrain({ __no_confidence_vote__: false })
    expect(countVisits('act3_no_confidence_survived')).toBe(1)
    expect(visited(), 'fallen sibling absent').not.toContain('act3_no_confidence_fallen')
    expect(nar().activeFlags).toContain('no_confidence_failed')
  }, 30000)

  it('assassination: exactly one track per trigger state', async () => {
    const scenes = [
      'act3_assassination_bombing',
      'act3_assassination_sniper',
      'act3_assassination_poisoning',
      'act3_assassination_default',
    ]
    const firedTracks = () => wk().forcedChainIds.filter(id => scenes.includes(id))

    // Sniper state: old guard hostile, streets calm.
    resetWorld()
    bootWeek(32)
    setFactions({ halvekists: 5, ironCovenant: 5 })
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 80 } })
    await finishWeek()
    expect(firedTracks(), 'sniper track only').toEqual(['act3_assassination_sniper'])

    // Bombing state: streets collapse, old guard loyal.
    resetWorld()
    bootWeek(32)
    setFactions({ halvekists: 80, ironCovenant: 80, dravenni: 5 })
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 5 } })
    await finishWeek()
    expect(firedTracks(), 'bombing track only').toEqual(['act3_assassination_bombing'])

    // Calm state: nothing fires.
    resetWorld()
    bootWeek(32)
    allFactions(70)
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 70 } })
    await finishWeek()
    expect(firedTracks(), 'no track when calm').toEqual([])

    // Defiant ultimatum rejection: war imminent + negotiation refused ->
    // the poisoning track only (Round 4 STEP 3 class-A fix).
    resetWorld()
    bootWeek(32)
    allFactions(70)
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 70 } })
    nar().loadScene('act3_week32_tyvaren_ultimatum')
    nar().processChoice('tyvaren_defiant_rejection')
    expect(nar().activeFlags, 'defiance records both trigger flags').toEqual(
      expect.arrayContaining(['tyvaren_war_imminent', 'refused_tyvaren_negotiation']),
    )
    await finishWeek()
    expect(firedTracks(), 'poisoning track only').toEqual(['act3_assassination_poisoning'])
  }, 40000)

  it('assassination matrix: tracks, injury finals, and downstream nodes', async () => {
    const ASSASS = [
      'act3_assassination_bombing',
      'act3_assassination_sniper',
      'act3_assassination_poisoning',
      'act3_assassination_default',
    ]
    const firedTracks = () => wk().forcedChainIds.filter(id => ASSASS.includes(id))
    const TREMOR: [string, string][] = [
      ['act4_week48_the_roll', 'two protection officers'],
      ['act5_week53_second_address', 'Put the notes down'],
      ['act5_week56_constitutional_court', 'The pen shook'],
      ['act6_week69_generals_toast', 'Keep the right hand below the table'],
      ['act6_week74_voss_cipher', 'two passes at the signature'],
      ['act6_week78_ashavel_legacy', 'The ringing is worse at night'],
      ['act7_week85_capital_strike', 'Three attempts before it was le'],
      ['act7_week90_campaign_trail', 'Keep the right hand in the jacket pocket'],
      ['act7_week100_final_debate', 'Grip the podium'],
    ]

    // Downstream of the permanent injury: fainting offered at 57, every
    // tremor node visible, wednesday_honest offered — iff injured.
    const checkDownstream = (injured: boolean) => {
      bootWeek(57)
      const offered = pool().map(i => i.sceneId)
      if (injured) expect(offered, 'fainting offered when injured').toContain('act5_week57_fainting_spell')
      else expect(offered, 'fainting absent when uninjured').not.toContain('act5_week57_fainting_spell')

      for (const [sid, anchor] of TREMOR) {
        const scene = getScene(sid)
        expect(scene, `${sid} loads`).toBeTruthy()
        const nodes = [
          ...(scene!.narrative ?? []),
          ...Object.values(scene!.segments ?? {}).flatMap(seg => seg.narrative ?? []),
        ]
        const withInjury = (filterNarrative(nodes, game(), ['permanent_injury_sustained']) ?? [])
          .map(n => (n as { text?: string }).text ?? '').join(' ')
        const without = (filterNarrative(nodes, game(), []) ?? [])
          .map(n => (n as { text?: string }).text ?? '').join(' ')
        if (injured) expect(withInjury, `${sid} tremor node visible`).toContain(anchor)
        expect(without, `${sid} tremor node hidden when uninjured`).not.toContain(anchor)
      }

      const debate = getScene('act7_week100_final_debate')!
      const reacts = debate.segments?.['seg_kolvar_reacts']?.choices ?? []
      const honest = (flags: string[]) =>
        reacts.filter(c => !c.conditions || evaluateAll(c.conditions, game(), flags)).map(c => c.id)
      if (injured) expect(honest(['permanent_injury_sustained']), 'wednesday_honest offered').toContain('wednesday_honest')
      else expect(honest([]), 'wednesday_honest absent').not.toContain('wednesday_honest')
    }

    // Path A — play The Shot at 30: injury sustained, variants blocked by the guard.
    resetWorld()
    bootWeek(30)
    await playChoice(pool().find(i => i.sceneId === 'act3_week29_assassination_attempt')!, 'w34_address_immediately')
    expect(nar().activeFlags, 'Shot records injury+survival').toEqual(
      expect.arrayContaining(['permanent_injury_sustained', 'assassination_survived', 'assassination_attempted', 'ashenmere_incident']),
    )
    setFactions({ halvekists: 5, ironCovenant: 5 })
    await finishWeek()
    expect(firedTracks(), 'Shot blocks all variant tracks').toEqual([])
    checkDownstream(true)

    // Path B — skip Shot, sniper stats: sniper only, no injury.
    resetWorld()
    bootWeek(30)
    setFactions({ halvekists: 5, ironCovenant: 5 })
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 80 } })
    await finishWeek()
    expect(firedTracks(), 'sniper track only').toEqual(['act3_assassination_sniper'])
    useWeekStore.getState().initWeek()
    await playChoice(pool().find(i => i.sceneId === 'act3_assassination_sniper')!, 'sniper_go_to_cabinet')
    expect(nar().activeFlags).toContain('serida_wounded_parade')
    expect(nar().activeFlags, 'sniper leaves no permanent injury').not.toContain('permanent_injury_sustained')
    checkDownstream(false)

    // Path C — skip Shot, bombing stats: bombing only, injury sustained.
    resetWorld()
    bootWeek(30)
    setFactions({ halvekists: 80, ironCovenant: 80, dravenni: 5 })
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 5 } })
    await finishWeek()
    expect(firedTracks(), 'bombing track only').toEqual(['act3_assassination_bombing'])
    useWeekStore.getState().initWeek()
    await playChoice(pool().find(i => i.sceneId === 'act3_assassination_bombing')!, 'bombing_go_to_cabinet')
    expect(nar().activeFlags).toContain('serida_died_bombing')
    expect(nar().activeFlags, 'bombing sustains injury').toContain('permanent_injury_sustained')
    checkDownstream(true)

    // Path D — skip Shot, defiant at 32: poisoning only, no injury.
    resetWorld()
    bootWeek(30)
    allFactions(70)
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 70 } })
    await finishWeek()
    expect(firedTracks(), 'nothing at calm 30; Shot skipped, not fired').toEqual([])
    bootWeek(32)
    nar().loadScene('act3_week32_tyvaren_ultimatum')
    nar().processChoice('tyvaren_defiant_rejection')
    await finishWeek()
    expect(firedTracks(), 'poisoning track only').toEqual(['act3_assassination_poisoning'])
    useWeekStore.getState().initWeek()
    await playChoice(pool().find(i => i.sceneId === 'act3_assassination_poisoning')!, 'poisoning_go_to_cabinet')
    expect(nar().activeFlags).toContain('poisoning_attempt')
    expect(nar().activeFlags, 'poisoning leaves no permanent injury').not.toContain('permanent_injury_sustained')
    checkDownstream(false)

    // Path E — skip Shot, calm throughout: nothing, no injury.
    resetWorld()
    bootWeek(30)
    allFactions(70)
    useGameStore.setState({ nation: { ...game().nation, publicOrder: 70 } })
    await finishWeek()
    expect(firedTracks()).toEqual([])
    expect(nar().activeFlags, 'no assassination flags').not.toContain('assassination_attempted')
    checkDownstream(false)
  }, 60000)

  it('mole accusation correct: correct payoff only (e15334f routing)', async () => {
    bootWeek(42)
    useGameStore.setState({ moleIdentity: 'petrin_half' })
    nar().loadScene('act4_mole_confrontation')
    nar().processChoice('mole_accuse_petrin')
    expect(nar().activeFlags, 'correctness recorded').toContain('mole_correct')
    expect(chn().scheduled.map(c => c.targetNodeId), 'correct payoff scheduled').toContain('act4_mole_correct_accusation')
    await finishWeek()
    expect(wk().forcedChainIds, 'correct payoff fired').toContain('act4_mole_correct_accusation')
    useWeekStore.getState().initWeek()
    expect(pool().map(i => i.sceneId), 'correct payoff offered in window').toContain('act4_mole_correct_accusation')
    await playItem(pool().find(i => i.sceneId === 'act4_mole_correct_accusation')!)
    expect(countVisits('act4_mole_correct_accusation')).toBe(1)
    expect(visited()).not.toContain('act4_mole_wrong_accusation')
  }, 30000)

  it('mole accusation wrong: wrong payoff only', async () => {
    bootWeek(42)
    useGameStore.setState({ moleIdentity: 'petrin_half' })
    nar().loadScene('act4_mole_confrontation')
    nar().processChoice('mole_accuse_dusek')
    expect(nar().activeFlags, 'wrongness recorded').toContain('mole_wrongly_accused')
    await finishWeek()
    expect(wk().forcedChainIds, 'wrong payoff fired').toContain('act4_mole_wrong_accusation')
    useWeekStore.getState().initWeek()
    expect(pool().map(i => i.sceneId), 'wrong payoff offered in window').toContain('act4_mole_wrong_accusation')
    await playItem(pool().find(i => i.sceneId === 'act4_mole_wrong_accusation')!)
    expect(countVisits('act4_mole_wrong_accusation')).toBe(1)
    expect(visited()).not.toContain('act4_mole_correct_accusation')
  }, 30000)

  it('exclusive redirect releases when the original qualifies; otherwise it cannot reload', () => {
    resetWorld()
    bootWeek(26)
    useGameStore.setState(s => ({
      factions: { ...s.factions, reformists: 65, halvekists: 30 },
    }))
    nar().loadScene('act2_week26_referendum_narrow')
    expect(nar().currentScene?.id, 'redirects while unqualified').toBe('act2_week26_referendum_decisive')
    // The original cannot reload itself while its prereqs fail.
    nar().loadScene('act2_week26_referendum_narrow')
    expect(nar().currentScene?.id, 'still redirects on reload').toBe('act2_week26_referendum_decisive')
    expect(nar().visitedSceneIds).toContain('act2_week26_referendum_narrow')

    // Once the stats qualify the original, it plays itself.
    resetWorld()
    bootWeek(26)
    useGameStore.setState(s => ({
      factions: { ...s.factions, reformists: 55, halvekists: 50 },
    }))
    nar().loadScene('act2_week26_referendum_narrow')
    expect(nar().currentScene?.id, 'plays itself when qualified').toBe('act2_week26_referendum_narrow')
  })

  it('coup climax option present iff attempted', () => {
    nar().loadScene('act3_week39_act3_climax')
    const without = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags).map(c => c.id)
    expect(without, 'coup option absent when not attempted').not.toContain('climax_coup_survival_focus')

    nar().addFlags(['coup_attempted'])
    const withIt = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags).map(c => c.id)
    expect(withIt, 'coup option present when attempted').toContain('climax_coup_survival_focus')
  })

  it('jonas divorce xor healing at week 78, Term-2 consistent at week 53', async () => {
    // Divorced: only the already-ended path.
    bootWeek(78, { flags: ['jonas_divorce', 'marriage_ended', 'jonas_left'] })
    useGameStore.setState({ personal: { ...game().personal, marriageHealth: 20 } })
    nar().loadScene('act6_week78_ashavel_legacy')
    nar().processChoice('check_marriage')
    expect(availChoices().map(c => c.id), 'divorced sees only already-ended').toEqual(['path_already_ended'])
    nar().processChoice('path_already_ended')
    expect(availChoices().map(c => c.id)).toEqual(['already_end'])
    nar().processChoice('already_end')
    expect(countVisits('act6_week78_ashavel_legacy')).toBe(1)

    // Healing: only the united path.
    resetWorld()
    bootWeek(78, { flags: ['family_chosen', 'family_healing_path'] })
    useGameStore.setState({ personal: { ...game().personal, marriageHealth: 70 } })
    nar().loadScene('act6_week78_ashavel_legacy')
    nar().processChoice('check_marriage')
    expect(availChoices().map(c => c.id), 'healed sees only united').toEqual(['path_united'])
    nar().processChoice('path_united')
    expect(availChoices().map(c => c.id)).toEqual(['united_end'])
    nar().processChoice('united_end')
    expect(countVisits('act6_week78_ashavel_legacy')).toBe(1)

    // Term-2 consistency through the real narrative filter.
    const scene = getScene('act5_week53_second_address')
    expect(scene, 'week-53 scene loads').toBeTruthy()
    const divorced = filterNarrative(scene!.narrative, game(), ['jonas_divorce']) ?? []
    const married = filterNarrative(scene!.narrative, game(), []) ?? []
    const dText = divorced.map(n => (n as { text?: string }).text ?? '').join(' ')
    const mText = married.map(n => (n as { text?: string }).text ?? '').join(' ')
    expect(dText, 'divorced: no front-row Jonas').not.toContain('Jonas is in the front row')
    expect(dText, 'divorced: solo fallback present').toContain('The front row holds the cabinet')
    expect(mText, 'married: Jonas present').toContain('Jonas is in the front row')
    expect(mText, 'married: no solo fallback').not.toContain('The front row holds the cabinet')
  }, 30000)

  it('second address variant per Term-1 outcome', async () => {
    const runVariant = async (flags: string[], endChoice: string, siblingEnds: string[]) => {
      resetWorld()
      bootWeek(53, { flags })
      nar().loadScene('act5_week53_second_address')
      nar().processChoice('check_term1_outcome')
      const paths = availChoices().map(c => c.id)
      expect(paths, `exactly one outcome path for [${flags}]`).toHaveLength(1)
      nar().processChoice(paths[0])
      for (let guard = 0; guard < 6; guard++) {
        const avail = availChoices().map(c => c.id)
        if (avail.includes(endChoice)) {
          nar().processChoice(endChoice)
          break
        }
        expect(avail.length, 'segment keeps moving').toBeGreaterThan(0)
        nar().processChoice(avail[0])
      }
      expect(countVisits('act5_week53_second_address')).toBe(1)
      for (const s of siblingEnds) {
        expect(nar().activeFlags, `${s} absent`).not.toContain(s)
      }
      return nar().activeFlags
    }

    const puppet = await runVariant(['government_captured'], 'puppet_end', ['oligarchs_fully_purged'])
    expect(puppet).toContain('puppet_government_active')
    const destroyed = await runVariant(['oligarchs_destroyed'], 'destroyed_end', ['puppet_government_active'])
    expect(destroyed).toContain('oligarchs_fully_purged')
    const clean = await runVariant([], 'clean_end', ['puppet_government_active', 'oligarchs_fully_purged'])
    expect(clean).toContain('term_2_begun')
  }, 30000)

  it('election boundaries at weeks 52 and 103', async () => {
    // Win at 51 -> week 52 continues with the term flag.
    resetWorld()
    bootWeek(51)
    useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
    await finishWeek()
    expect(game().currentWeek, 'advanced to 52').toBe(52)
    expect(nar().activeFlags, 'term-1 win recorded').toContain('election_won_term_1')
    expect(wk().phase, 'game continues').not.toBe('epilogue')

    // Loss at 51 -> defeat epilogue.
    resetWorld()
    bootWeek(51)
    useGameStore.setState({ playerPolling: 20, kolvarPolling: 75 })
    await finishWeek()
    await vi.advanceTimersByTimeAsync(2000)
    expect(wk().phase, 'defeat epilogue').toBe('epilogue')

    // Win at 103 -> second election ends the game (term limit).
    resetWorld()
    bootWeek(103)
    useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
    await finishWeek()
    await vi.advanceTimersByTimeAsync(2000)
    expect(game().currentWeek, 'reached 104').toBe(104)
    expect(wk().phase, 'term-limit epilogue').toBe('epilogue')
  }, 30000)

  it('nextNodeId swap filters per-node conditions (press_outcome follow-up)', () => {
    const outcomeText = () =>
      (nar().currentScene?.narrative ?? []).map(n => (n as { text?: string }).text ?? '').join(' ')

    // Specific: Vyktor follows up on the announced commitments.
    resetWorld()
    bootWeek(27)
    nar().loadScene('act2_week27_press_followup')
    nar().processChoice('press_followup_specific')
    expect(nar().currentScene?.id, 'swapped to outcome').toBe('act2_week27_press_outcome')
    expect(outcomeText(), 'committee node shown').toContain('twelve names by Friday')
    expect(outcomeText()).not.toContain('best follow-up is absence')

    // Deflect: dodge node instead, no invented commitments.
    resetWorld()
    bootWeek(27)
    nar().loadScene('act2_week27_press_followup')
    nar().processChoice('press_followup_deflect')
    expect(nar().currentScene?.id, 'swapped to outcome').toBe('act2_week27_press_outcome')
    expect(outcomeText(), 'dodge node shown').toContain('best follow-up is absence')
    expect(outcomeText()).not.toContain('twelve names by Friday')

    // Combative: damage-control node, no invented commitments.
    resetWorld()
    bootWeek(27)
    nar().loadScene('act2_week27_press_followup')
    nar().processChoice('press_followup_combative')
    expect(outcomeText(), 'fight node shown').toContain('smoothing editors')
    expect(outcomeText()).not.toContain('twelve names by Friday')
  })
})

describe('flag timing (Phase B3 STEP 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(ms => vi.advanceTimersByTimeAsync(ms))
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  it('segment transitions filter on pre-choice flags (narrativeStore.ts:676)', () => {
    // Minimal probe driven through the REAL processChoice. No authored scene
    // gates a segment node on its entering choice's own flag (S7: 0 cases),
    // so the rule is pinned with a synthetic scene — test-only, no data edit.
    const probe: NarrativeNode = {
      id: 'flag_timing_segment_probe',
      title: 'probe',
      act: 1,
      weekAvailable: 1,
      type: 'event',
      agendaCost: 0,
      location: 'probe',
      characters: [],
      prerequisites: [],
      narrative: [{ type: 'description', text: 'probe opening' }],
      choices: [{ id: 'probe_go', text: 'Go.', flags: ['probe_flag_set'], nextSegment: 'probe_seg' }],
      segments: {
        probe_seg: {
          narrative: [
            {
              type: 'description',
              text: 'sealed orders travel with the courier',
              conditions: [{ type: 'flag', flag: 'probe_flag_set', value: true }],
            },
            {
              type: 'description',
              text: 'the desk stands empty; no orders have arrived',
              conditions: [{ type: 'flag', flag: 'probe_flag_set', value: false }],
            },
          ],
          choices: [{ id: 'probe_end', text: 'End.' }],
        },
      },
    }
    useNarrativeStore.setState({ currentScene: probe, activeSegmentId: null, sceneDone: false })
    expect(
      getAvailableChoices(nar().currentScene, game(), nar().activeFlags).map(c => c.id),
      'probe choice offered',
    ).toContain('probe_go')
    nar().processChoice('probe_go')
    // The flag WAS applied by the choice ...
    expect(nar().activeFlags, 'entering flag recorded').toContain('probe_flag_set')
    // ... but the arriving segment was filtered with the pre-choice flags,
    // so the node gated on the entering choice's own flag stays hidden.
    const shown = (nar().currentScene?.narrative ?? []).map(n => n.text ?? '').join(' ')
    expect(shown, 'absence node shown').toContain('the desk stands empty')
    expect(shown, 'entering-flag node hidden').not.toContain('sealed orders')
  })

  it('nextNodeId targets filter on post-choice flags (narrativeStore.ts:664)', () => {
    const outcome = getScene('act2_week27_press_outcome')
    expect(outcome, 'outcome scene loads').toBeTruthy()
    // Under pre-choice flags ([]) NO variant node qualifies: all three gate
    // on a flag only the entering choice sets. (The unconditional corridor
    // opener is not a variant and always survives.)
    const variants = (outcome!.narrative ?? []).filter(n => (n.conditions ?? []).length > 0)
    expect(variants, 'three variant nodes authored').toHaveLength(3)
    expect(filterNarrative(variants, game(), []) ?? []).toHaveLength(0)
    const runVariant = (choiceId: string): string => {
      resetWorld()
      bootWeek(27)
      nar().loadScene('act2_week27_press_followup')
      nar().processChoice(choiceId)
      expect(nar().currentScene?.id, 'swapped to outcome').toBe('act2_week27_press_outcome')
      return (nar().currentScene?.narrative ?? []).map(n => n.text ?? '').join(' ')
    }
    // All three runs start from IDENTICAL pre-choice flags — the only
    // difference is the flag the choice just set — so each outcome proves
    // the swap filtered on newFlags.
    const specific = runVariant('press_followup_specific')
    expect(specific, 'specific shows committee node').toContain('twelve names by Friday')
    expect(specific).not.toContain('best follow-up is absence')
    expect(specific).not.toContain('smoothing editors')
    const deflect = runVariant('press_followup_deflect')
    expect(deflect, 'deflect shows dodge node').toContain('best follow-up is absence')
    expect(deflect).not.toContain('twelve names by Friday')
    expect(deflect).not.toContain('smoothing editors')
    const combative = runVariant('press_followup_combative')
    expect(combative, 'combative shows damage-control node').toContain('smoothing editors')
    expect(combative).not.toContain('twelve names by Friday')
    expect(combative).not.toContain('best follow-up is absence')
  })

  it('delay-0 chains inject unconditionally and load with then-current flags', async () => {
    const anchor = (sceneId: string): AgendaItem => ({
      id: `flag-timing-${sceneId}`,
      title: 'flag-timing probe',
      description: '',
      category: 'crisis',
      sceneId,
      slotCost: 0,
      executionOrder: 0,
      weekAvailable: 33,
    } as AgendaItem)
    const queued = () => wk().sceneQueue.map(i => i.sceneId)

    // Injection evaluates nothing: the target lands in the queue even though
    // its prerequisite flag (tyvaren_ultimatum_rejected) is absent.
    resetWorld()
    bootWeek(33, { flags: ['tyvaren_diplomacy_initiated'] })
    useWeekStore.setState({ sceneQueue: [anchor('act3_week33_diplomatic_negotiation')], currentQueueIndex: 0 })
    wk().injectScene('act3_week33_war_preparations', 'probe')
    expect(queued(), 'delay-0 target queued despite unmet prereq').toContain('act3_week33_war_preparations')
    // Load with the gate flag still absent: the exclusive fallback qualifies.
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(nar().currentScene?.id, 'fallback loads when gate absent').toBe('act3_week33_diplomatic_negotiation')

    // Identical at inject time, but the gate flag arrives between inject and
    // load: the qualified scene plays. Flags apply at load, not at schedule.
    resetWorld()
    bootWeek(33, { flags: ['tyvaren_diplomacy_initiated'] })
    useWeekStore.setState({ sceneQueue: [anchor('act3_week33_diplomatic_negotiation')], currentQueueIndex: 0 })
    wk().injectScene('act3_week33_war_preparations', 'probe')
    nar().addFlags(['tyvaren_ultimatum_rejected'])
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(nar().currentScene?.id, 'target loads when gate set before load').toBe('act3_week33_war_preparations')

    // Full choice path: the hard rejection sets the gate flag and injects
    // delay-0; the target loads qualified at advance time.
    resetWorld()
    bootWeek(33, { flags: ['tyvaren_diplomacy_initiated'] })
    wk().launchSingleScene(anchor('act3_week33_diplomatic_negotiation'))
    expect(nar().currentScene?.id, 'negotiation plays when qualified').toBe('act3_week33_diplomatic_negotiation')
    nar().processChoice('diplomacy_hard_rejection')
    expect(nar().activeFlags, 'choice sets the gate flag').toContain('tyvaren_ultimatum_rejected')
    expect(queued(), 'choice injected delay-0 target').toContain('act3_week33_war_preparations')
    wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    expect(nar().currentScene?.id, 'war preparations load after hard rejection').toBe('act3_week33_war_preparations')
  }, 30000)
})
